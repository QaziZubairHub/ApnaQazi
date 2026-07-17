import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSettings } from '../../../hooks/useSettings';
import { useToast } from '../../../hooks/useToast';
import { logAuditEvent } from '../../../services/audit';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Toggle from '../../../components/ui/Toggle';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const API = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('api');
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
    setSaving(true);
    const oldData = { ...settings };
    const result = await updateSettings(formData);

    if (result.success) {
      showToast('API settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'api', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="API Base URL"
            name="baseUrl"
            value={formData.baseUrl || ''}
            onChange={handleChange}
            placeholder="https://api.example.com"
          />
          <Input
            label="API Version"
            name="apiVersion"
            value={formData.apiVersion || 'v1'}
            onChange={handleChange}
            placeholder="v1"
          />
          <Input
            label="Rate Limit (requests per minute)"
            name="rateLimit"
            type="number"
            value={formData.rateLimit || ''}
            onChange={handleChange}
            placeholder="100"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">API Options</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable REST API"
            name="enableRest"
            checked={formData.enableRest !== false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable GraphQL API"
            name="enableGraphQL"
            checked={formData.enableGraphQL || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Webhooks"
            name="enableWebhooks"
            checked={formData.enableWebhooks || false}
            onChange={handleChange}
          />
          <Toggle
            label="Require API Key Authentication"
            name="requireApiKey"
            checked={formData.requireApiKey || false}
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

export default API;
