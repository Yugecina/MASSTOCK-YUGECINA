import { useState, FormEvent, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { adminClientService } from '../../services/adminClientService';
import { Spinner } from '../ui/Spinner';
import type { AddClientModalProps, CreateClientFormData } from '../../types/admin';

interface FormErrors {
  name?: string;
}

interface FormState {
  name: string;
  plan: string;
  subscription_amount: string;
}

/**
 * AddClientModal - Modal to create a new client (company)
 * Client = company with name, plan, subscription amount
 * Members and workflows are added separately after creation
 */
export function AddClientModal({ onClose, onSuccess }: AddClientModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormState>({
    name: '',
    plan: 'premium_custom',
    subscription_amount: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  console.log('📝 AddClientModal: Render', { formData, loading });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Company name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('📝 AddClientModal: Submitting', { formData });

    if (!validateForm()) {
      console.log('❌ AddClientModal: Validation failed', { errors });
      return;
    }

    setLoading(true);
    try {
      const payload: CreateClientFormData = {
        name: formData.name.trim(),
        plan: formData.plan,
        subscription_amount: formData.subscription_amount ? parseFloat(formData.subscription_amount) : 0
      };

      console.log('📡 AddClientModal: Calling API', { payload });
      const response = await adminClientService.createClient(payload);
      console.log('✅ AddClientModal: Success', { response });

      toast.success('Client created successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ AddClientModal: Error', {
        error,
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      toast.error(error.response?.data?.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Client</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="text-muted mb-6">
              Create a new client company. You can add members and workflows after creation.
            </p>

            {/* Company Name */}
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Acme Corporation"
                disabled={loading}
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Plan */}
            <div className="form-group">
              <label className="form-label">Plan</label>
              <select
                name="plan"
                className="form-select"
                value={formData.plan}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="premium_custom">Premium Custom</option>
              </select>
            </div>

            {/* Subscription Amount */}
            <div className="form-group">
              <label className="form-label">Monthly Subscription ($)</label>
              <input
                type="number"
                name="subscription_amount"
                className="form-input"
                value={formData.subscription_amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={loading}
              />
              <span className="form-hint">Leave empty for $0</span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
