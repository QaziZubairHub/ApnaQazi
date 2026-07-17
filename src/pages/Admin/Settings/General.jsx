import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSettings } from '../../../hooks/useSettings';
import { useToast } from '../../../hooks/useToast';
import { logAuditEvent } from '../../../services/audit';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Toggle from '../../../components/ui/Toggle';
import ImageUpload from '../../../components/settings/ImageUpload';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { validateGeneralSettings } from '../../../utils/validators';

const General = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('general');
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
    const validation = validateGeneralSettings(formData);
    if (!validation.isValid) {
      showToast(validation.errors.join(', '), 'error');
      return;
    }

    setSaving(true);
    const oldData = { ...settings };
    const result = await updateSettings(formData);

    if (result.success) {
      showToast('General settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'general', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Website Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Website Name"
            name="websiteName"
            value={formData.websiteName || ''}
            onChange={handleChange}
            placeholder="My Store"
          />
          <Input
            label="Company Name"
            name="companyName"
            value={formData.companyName || ''}
            onChange={handleChange}
            placeholder="My Company LLC"
          />
          <ImageUpload
            label="Logo"
            value={formData.logo}
            onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
          />
          <ImageUpload
            label="Favicon"
            value={formData.favicon}
            onChange={(url) => setFormData((prev) => ({ ...prev, favicon: url }))}
          />
          <Input
            label="Admin Email"
            name="adminEmail"
            type="email"
            value={formData.adminEmail || ''}
            onChange={handleChange}
            placeholder="admin@example.com"
          />
          <Input
            label="Support Email"
            name="supportEmail"
            type="email"
            value={formData.supportEmail || ''}
            onChange={handleChange}
            placeholder="support@example.com"
          />
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="+1234567890"
          />
          <div className="md:col-span-2">
            <Input
              label="Company Address"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder="Full company address"
            />
          </div>
          <Input
            label="Copyright Text"
            name="copyright"
            value={formData.copyright || ''}
            onChange={handleChange}
            placeholder="© 2025 My Company"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Website Status</h2>
        <div className="space-y-4">
          <Toggle
            label="Website Online"
            name="websiteOnline"
            checked={formData.websiteOnline || false}
            onChange={handleChange}
          />
          <Toggle
            label="Maintenance Mode"
            name="maintenanceMode"
            checked={formData.maintenanceMode || false}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Regional Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Timezone"
            name="timezone"
            value={formData.timezone || ''}
            onChange={handleChange}
            placeholder="UTC"
          />
          <Input
            label="Date Format"
            name="dateFormat"
            value={formData.dateFormat || ''}
            onChange={handleChange}
            placeholder="YYYY-MM-DD"
          />
          <Input
            label="Currency"
            name="currency"
            value={formData.currency || ''}
            onChange={handleChange}
            placeholder="USD"
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

export default General;
