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

const Appearance = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('appearance');
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
      showToast('Appearance settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'appearance', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">Appearance Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Theme</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Primary Color"
            name="primaryColor"
            type="color"
            value={formData.primaryColor || '#3B82F6'}
            onChange={handleChange}
          />
          <Input
            label="Secondary Color"
            name="secondaryColor"
            type="color"
            value={formData.secondaryColor || '#8B5CF6'}
            onChange={handleChange}
          />
          <Input
            label="Font Family"
            name="fontFamily"
            value={formData.fontFamily || ''}
            onChange={handleChange}
            placeholder="Inter, Roboto, etc."
          />
          <Input
            label="Border Radius"
            name="borderRadius"
            value={formData.borderRadius || ''}
            onChange={handleChange}
            placeholder="8px"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Logo & Favicon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Layout Options</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable Dark Mode"
            name="darkMode"
            checked={formData.darkMode || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable RTL Layout"
            name="rtl"
            checked={formData.rtl || false}
            onChange={handleChange}
          />
          <Toggle
            label="Show Sidebar"
            name="showSidebar"
            checked={formData.showSidebar !== false}
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

export default Appearance;
