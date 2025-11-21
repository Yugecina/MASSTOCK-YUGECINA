/**
 * Composant UserForm - Formulaire de création/édition d'utilisateur
 * @file UserForm.jsx
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Spinner } from '../ui/Spinner';

// Schéma de validation pour la création
const createSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  company_name: z.string().min(1, 'Company is required'),
  plan: z.enum(['starter', 'pro', 'premium_custom']),
  subscription_amount: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user')
});

// Schéma de validation pour l'édition (password optionnel)
const editSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required'),
  company_name: z.string().min(1, 'Company is required'),
  plan: z.enum(['starter', 'pro', 'premium_custom']),
  subscription_amount: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  role: z.enum(['user', 'admin']).optional()
});

export function UserForm({ mode = 'create', user = null, onSubmit, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const schema = mode === 'create' ? createSchema : editSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    trigger
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: user || {
      email: '',
      password: '',
      name: '',
      company_name: '',
      plan: 'starter',
      subscription_amount: '0',
      status: 'active',
      role: 'user'
    }
  });

  // Reset form when user changes (for edit mode)
  useEffect(() => {
    if (user) {
      reset({
        ...user,
        subscription_amount: user.subscription_amount?.toString() || '0'
      });
    }
  }, [user, reset]);

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      // Remove password if empty in edit mode
      if (mode === 'edit' && !data.password) {
        delete data.password;
      }

      // Convert subscription_amount to number
      const submitData = {
        ...data,
        subscription_amount: parseFloat(data.subscription_amount || 0)
      };

      await onSubmit(submitData);
    } catch (error) {
      setApiError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Email Field */}
      <div className="input-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          onBlur={() => trigger('email')}
          className={errors.email ? 'input-error' : ''}
          disabled={isSubmitting}
        />
        {errors.email && (
          <span className="text-error text-sm">{errors.email.message}</span>
        )}
      </div>

      {/* Name Field */}
      <div className="input-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          {...register('name')}
          onBlur={() => trigger('name')}
          className={errors.name ? 'input-error' : ''}
          disabled={isSubmitting}
        />
        {errors.name && (
          <span className="text-error text-sm">{errors.name.message}</span>
        )}
      </div>

      {/* Company Field */}
      <div className="input-group">
        <label htmlFor="company_name">Company</label>
        <input
          id="company_name"
          type="text"
          {...register('company_name')}
          onBlur={() => trigger('company_name')}
          className={errors.company_name ? 'input-error' : ''}
          disabled={isSubmitting}
        />
        {errors.company_name && (
          <span className="text-error text-sm">{errors.company_name.message}</span>
        )}
      </div>

      {/* Password Field */}
      <div className="input-group">
        <label htmlFor="password">
          Password {mode === 'edit' && <span className="text-neutral-500">(leave blank to keep current)</span>}
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          onBlur={() => trigger('password')}
          className={errors.password ? 'input-error' : ''}
          disabled={isSubmitting}
          placeholder={mode === 'edit' ? 'Leave blank to keep current' : ''}
        />
        {errors.password && (
          <span className="text-error text-sm">{errors.password.message}</span>
        )}
      </div>

      {/* Plan Field */}
      <div className="input-group">
        <label htmlFor="plan">Plan</label>
        <select
          id="plan"
          {...register('plan')}
          className={errors.plan ? 'input-error' : ''}
          disabled={isSubmitting}
        >
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="premium_custom">Premium Custom</option>
        </select>
        {errors.plan && (
          <span className="text-error text-sm">{errors.plan.message}</span>
        )}
      </div>

      {/* Subscription Amount Field */}
      <div className="input-group">
        <label htmlFor="subscription_amount">Subscription Amount</label>
        <input
          id="subscription_amount"
          type="number"
          step="0.01"
          min="0"
          {...register('subscription_amount')}
          className={errors.subscription_amount ? 'input-error' : ''}
          disabled={isSubmitting}
          placeholder="0.00"
        />
        {errors.subscription_amount && (
          <span className="text-error text-sm">{errors.subscription_amount.message}</span>
        )}
      </div>

      {/* Role Field */}
      <div className="input-group">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          {...register('role')}
          className={errors.role ? 'input-error' : ''}
          disabled={isSubmitting}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && (
          <span className="text-error text-sm">{errors.role.message}</span>
        )}
      </div>

      {/* Status Field (only in edit mode) */}
      {mode === 'edit' && (
        <div className="input-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            {...register('status')}
            className={errors.status ? 'input-error' : ''}
            disabled={isSubmitting}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          {errors.status && (
            <span className="text-error text-sm">{errors.status.message}</span>
          )}
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div className="bg-error-light border border-error rounded p-4">
          <p className="text-error text-sm">{apiError}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            mode === 'create' ? 'Create User' : 'Update User'
          )}
        </button>
      </div>
    </form>
  );
}
