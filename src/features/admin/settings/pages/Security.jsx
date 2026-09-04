import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useSettings } from '../../../../hooks/useSettings';
import { useToast } from '../../../../hooks/useToast';
import { logAuditEvent } from '../../../../services/audit';
import Card from '../../../../components/ui/Card';
import Input from '../../../../components/ui/Input';
import Toggle from '../../../../components/ui/Toggle';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

const Security = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('security');
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
      showToast('Security settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'security', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Authentication</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable Two-Factor Authentication"
            name="enable2FA"
            checked={formData.enable2FA || false}
            onChange={handleChange}
          />
          <Toggle
            label="Force Password Reset on First Login"
            name="forcePasswordReset"
            checked={formData.forcePasswordReset || false}
            onChange={handleChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
            <input
              type="number"
              name="sessionTimeout"
              value={formData.sessionTimeout || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="60"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Access Control</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable IP Whitelist"
            name="enableIPWhitelist"
            checked={formData.enableIPWhitelist || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Rate Limiting"
            name="enableRateLimiting"
            checked={formData.enableRateLimiting || false}
            onChange={handleChange}
          />
          <Input
            label="Allowed IPs (comma separated)"
            name="allowedIPs"
            value={formData.allowedIPs || ''}
            onChange={handleChange}
            placeholder="192.168.1.1, 10.0.0.1"
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

export default Security;
