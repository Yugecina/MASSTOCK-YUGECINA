import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { adminClientService } from '../../services/adminClientService';
import { Spinner } from '../ui/Spinner';
import type { EditClientModalProps, EditClientFormData } from '../../types/admin';

interface FormErrors {
  name?: string;
}

/**
 * EditClientModal - Modal to edit client (company) details
 */
export function EditClientModal({ client, onClose, onSuccess }: EditClientModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<EditClientFormData & { subscription_amount: string }>({
    name: '',
    plan: 'premium_custom',
    status: 'active',
    subscription_amount: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  console.log('📝 EditClientModal: Render', { client, formData, loading });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        plan: client.plan || 'premium_custom',
        status: client.status || 'active',
        subscription_amount: client.subscription_amount?.toString() || ''
      });
    }
  }, [client]);

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
    console.log('📝 EditClientModal: Submitting', { clientId: client.id, formData });

    if (!validateForm()) {
      console.log('❌ EditClientModal: Validation failed', { errors });
      return;
    }

    setLoading(true);
    try {
      const payload: EditClientFormData = {
        name: formData.name.trim(),
        plan: formData.plan,
        status: formData.status,
        subscription_amount: formData.subscription_amount ? parseFloat(formData.subscription_amount) : 0
      };

      console.log('📡 EditClientModal: Calling API', { payload });
      const response = await adminClientService.updateClient(client.id, payload);
      console.log('✅ EditClientModal: Success', { response });

      toast.success('Client updated successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ EditClientModal: Error', {
        error,
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      toast.error(error.response?.data?.message || 'Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to suspend "${client.name}"? This action can be reversed.`)) {
      return;
    }

    console.log('🗑️ EditClientModal: Suspending client', { clientId: client.id });
    setLoading(true);
    try {
      await adminClientService.deleteClient(client.id);
      console.log('✅ EditClientModal: Client suspended');
      toast.success('Client suspended successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ EditClientModal: Delete error', {
        error,
        message: error.message,
        data: error.response?.data
      });
      toast.error(error.response?.data?.message || 'Failed to suspend client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Client</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
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
            </div>
          </div>

          <div className="modal-footer modal-footer--between">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              Suspend Client
            </button>
            <div className="modal-footer-actions">
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
                {loading ? <Spinner size="sm" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
