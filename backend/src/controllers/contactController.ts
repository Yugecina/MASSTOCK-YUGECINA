/**
 * Contact Controller
 * Handles public contact form submissions
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { logger } from '../config/logger';
import { z } from 'zod';
import { emailService } from '../services/emailService';

// Validation schema
const contactSubmissionSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  company: z.string().trim().max(255).optional(),
  topic: z.enum([
    'Automation Development',
    'Generation Pricing',
    'Process Audit',
    'Partnership',
    'Other'
  ]),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000)
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

/**
 * POST /api/v1/contact
 * Submit contact form (public endpoint)
 */
export async function submitContact(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const validatedData = contactSubmissionSchema.parse(req.body);

    logger.debug('📨 ContactController: Processing contact form submission', {
      email: validatedData.email,
      topic: validatedData.topic
    });

    // Insert into database
    const { data: submission, error: dbError } = await supabaseAdmin
      .from('contact_submissions')
      .insert({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        email: validatedData.email,
        company: validatedData.company || null,
        topic: validatedData.topic,
        message: validatedData.message,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'new'
      })
      .select()
      .single();

    if (dbError) {
      logger.error('❌ ContactController: Failed to save contact submission', {
        error: dbError.message,
        code: dbError.code
      });
      res.status(500).json({
        success: false,
        error: 'Failed to save submission',
        code: 'DATABASE_ERROR'
      });
      return;
    }

    logger.info('✅ ContactController: Contact form submitted', {
      submissionId: submission.id,
      email: validatedData.email,
      topic: validatedData.topic
    });

    // Send email notification and add to audience (async, don't block response)
    const contactData = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      company: validatedData.company,
      topic: validatedData.topic,
      message: validatedData.message,
      submissionId: submission.id
    };

    emailService
      .sendContactNotification(contactData)
      .then(async (emailResult) => {
        // Update submission with email status
        if (emailResult.success) {
          await supabaseAdmin
            .from('contact_submissions')
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString()
            })
            .eq('id', submission.id);
        }

        // Add contact to Resend audience (no duplicates)
        await emailService.addContactToAudience(contactData);
      })
      .catch((err) => {
        logger.error('❌ ContactController: Failed to send contact notification', {
          error: err.message,
          submissionId: submission.id
        });
      });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Thank you for your message. We will get back to you within 24 hours.',
      data: {
        id: submission.id,
        created_at: submission.created_at
      }
    });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.debug('⚠️ ContactController: Validation error', {
        errors: error.issues
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }

    // Log unexpected errors
    logger.error('❌ ContactController: Unexpected error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process submission',
      code: 'SUBMISSION_ERROR'
    });
  }
}
