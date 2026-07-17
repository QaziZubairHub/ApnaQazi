import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSettings } from '../../../hooks/useSettings';
import { useToast } from '../../../hooks/useToast';
import { logAuditEvent } from '../../../services/audit';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Toggle from '../../../components/ui/Toggle';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const Firebase = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('firebase');
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
      showToast('Firebase settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'firebase', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">Firebase Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Firebase Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="API Key"
            name="apiKey"
            value={formData.apiKey || ''}
            onChange={handleChange}
            placeholder="Enter API key"
          />
          <Input
            label="Auth Domain"
            name="authDomain"
            value={formData.authDomain || ''}
            onChange={handleChange}
            placeholder="your-app.firebaseapp.com"
          />
          <Input
            label="Project ID"
            name="projectId"
            value={formData.projectId || ''}
            onChange={handleChange}
            placeholder="your-project-id"
          />
          <Input
            label="Storage Bucket"
            name="storageBucket"
            value={formData.storageBucket || ''}
            onChange={handleChange}
            placeholder="your-app.appspot.com"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Firebase Options</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable Analytics"
            name="enableAnalytics"
            checked={formData.enableAnalytics || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Cloud Messaging"
            name="enableCloudMessaging"
            checked={formData.enableCloudMessaging || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Performance Monitoring"
            name="enablePerformance"
            checked={formData.enablePerformance || false}
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

export default Firebase;
