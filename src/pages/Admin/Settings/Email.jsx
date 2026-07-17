import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSettings } from '../../../hooks/useSettings';
import { useToast } from '../../../hooks/useToast';
import { logAuditEvent } from '../../../services/audit';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Toggle from '../../../components/ui/Toggle';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { validateEmailSettings } from '../../../utils/validators';

const Email = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('email');
  const { showToast } = useToast();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    const validation = validateEmailSettings(formData);
    if (!validation.isValid) {
      showToast(validation.errors.join(', '), 'error');
      return;
    }

    setSaving(true);
    const oldData = { ...settings };
    const result = await updateSettings(formData);

    if (result.success) {
      showToast('Email settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'email', oldData, formData);
    } else {
      showToast('Failed to save settings: ' + result.error, 'error');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="SMTP Host"
            name="smtpHost"
            value={formData.smtpHost || ''}
            onChange={handleChange}
            placeholder="smtp.gmail.com"
          />
          <Input
            label="SMTP Port"
            name="smtpPort"
            type="number"
            value={formData.smtpPort || ''}
            onChange={handleChange}
            placeholder="587"
          />
          <Input
            label="SMTP Username"
            name="smtpUser"
            value={formData.smtpUser || ''}
            onChange={handleChange}
            placeholder="username@example.com"
          />
          <Input
            label="SMTP Password"
            name="smtpPassword"
            type="password"
            value={formData.smtpPassword || ''}
            onChange={handleChange}
            placeholder="Enter password"
          />
          <Input
            label="From Email"
            name="fromEmail"
            type="email"
            value={formData.fromEmail || ''}
            onChange={handleChange}
            placeholder="noreply@example.com"
          />
          <Input
            label="From Name"
            name="fromName"
            value={formData.fromName || ''}
            onChange={handleChange}
            placeholder="My Store"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Email Options</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable Order Confirmation Emails"
            name="enableOrderConfirmation"
            checked={formData.enableOrderConfirmation || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Shipping Notification Emails"
            name="enableShippingNotification"
            checked={formData.enableShippingNotification || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Password Reset Emails"
            name="enablePasswordReset"
            checked={formData.enablePasswordReset || false}
            onChange={handleChange}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {saving && <LoadingSpinner size="sm" className="mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default Email;
