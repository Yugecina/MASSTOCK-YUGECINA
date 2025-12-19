/**
 * Email Service using Resend
 * Sends transactional emails for MasStock
 */

import { logger } from '../config/logger';

interface ContactEmailData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  topic: string;
  message: string;
  submissionId: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface ResendApiResponse {
  id?: string;
  message?: string;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private toEmail: string;
  private baseUrl: string;
  private audienceId: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'MasStock <noreply@masstock.fr>';
    this.toEmail = process.env.EMAIL_TO || 'contact@masstock.fr';
    this.audienceId = process.env.RESEND_AUDIENCE_ID || '';
    this.baseUrl = 'https://api.resend.com';
  }

  /**
   * Send contact form notification email
   */
  async sendContactNotification(data: ContactEmailData): Promise<EmailResult> {
    if (!this.apiKey) {
      logger.warn('⚠️ EmailService: RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [this.toEmail],
          subject: `[MasStock] New Contact: ${data.topic} - ${data.firstName} ${data.lastName}`,
          html: this.buildContactEmailHtml(data),
          reply_to: data.email
        })
      });

      const result: ResendApiResponse = await response.json();

      if (!response.ok) {
        logger.error('❌ EmailService: Resend API error', {
          status: response.status,
          result,
          submissionId: data.submissionId
        });
        return { success: false, error: result.message || 'Email send failed' };
      }

      logger.info('✅ EmailService: Contact notification sent', {
        submissionId: data.submissionId,
        messageId: result.id,
        recipient: this.toEmail
      });

      return { success: true, messageId: result.id };

    } catch (error: any) {
      logger.error('❌ EmailService: Failed to send email', {
        error: error.message,
        submissionId: data.submissionId
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add contact to Resend audience (no duplicates)
   */
  async addContactToAudience(data: ContactEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      logger.warn('⚠️ EmailService: RESEND_API_KEY not configured, skipping contact creation');
      return { success: false, error: 'Email service not configured' };
    }

    if (!this.audienceId) {
      logger.warn('⚠️ EmailService: RESEND_AUDIENCE_ID not configured, skipping contact creation');
      return { success: false, error: 'Audience ID not configured' };
    }

    try {
      const contactPayload: any = {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        unsubscribed: false
      };

      // Add custom properties if provided
      if (data.company) {
        contactPayload.properties = {
          company_name: data.company
        };
      }

      const response = await fetch(`${this.baseUrl}/audiences/${this.audienceId}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactPayload)
      });

      const result: any = await response.json();

      // 422 = Contact already exists (not an error, just skip)
      if (response.status === 422 && result.message?.includes('already exists')) {
        logger.debug('ℹ️ EmailService: Contact already exists in audience', {
          email: data.email,
          audienceId: this.audienceId
        });
        return { success: true }; // Success because contact is in the list
      }

      if (!response.ok) {
        logger.error('❌ EmailService: Failed to add contact to audience', {
          status: response.status,
          result,
          email: data.email
        });
        return { success: false, error: result.message || 'Failed to add contact' };
      }

      logger.info('✅ EmailService: Contact added to audience', {
        email: data.email,
        audienceId: this.audienceId,
        contactId: result.id
      });

      return { success: true };

    } catch (error: any) {
      logger.error('❌ EmailService: Error adding contact to audience', {
        error: error.message,
        email: data.email
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Build HTML email template for contact form notification
   */
  private buildContactEmailHtml(data: ContactEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #0D7C7C;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 4px 4px 0 0;
          }
          .content {
            padding: 20px;
            background: #f9fafb;
          }
          .field {
            margin-bottom: 15px;
          }
          .label {
            font-weight: bold;
            color: #4B5563;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .value {
            margin-top: 5px;
            padding: 10px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
          .message {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6B7280;
            border-top: 1px solid #e5e7eb;
          }
          .topic-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #0D7C7C;
            color: white;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📩 New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${this.escapeHtml(data.firstName)} ${this.escapeHtml(data.lastName)}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${this.escapeHtml(data.email)}" style="color: #0D7C7C; text-decoration: none;">${this.escapeHtml(data.email)}</a></div>
            </div>
            <div class="field">
              <div class="label">Company</div>
              <div class="value">${data.company ? this.escapeHtml(data.company) : '<em style="color: #9CA3AF;">Not provided</em>'}</div>
            </div>
            <div class="field">
              <div class="label">Topic</div>
              <div class="value"><span class="topic-badge">${this.escapeHtml(data.topic)}</span></div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="value message">${this.escapeHtml(data.message)}</div>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 5px 0; color: #9CA3AF;">Submission ID: <code>${data.submissionId}</code></p>
            <p style="margin: 5px 0;">This email was sent from <strong>masstock.fr</strong> contact form</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Escape HTML to prevent XSS in email
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export const emailService = new EmailService();
export default emailService;
