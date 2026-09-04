import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useSettings } from '../../../../hooks/useSettings';
import { useToast } from '../../../../hooks/useToast';
import { logAuditEvent } from '../../../../services/audit';
import Card from '../../../../components/ui/Card';
import Input from '../../../../components/ui/Input';
import Toggle from '../../../../components/ui/Toggle';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

const SEO = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('seo');
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
      showToast('SEO settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'seo', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Meta Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Store - Best Products"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea
              name="metaDescription"
              value={formData.metaDescription || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Best online store for quality products"
            />
          </div>
          <Input
            label="Meta Keywords"
            name="metaKeywords"
            value={formData.metaKeywords || ''}
            onChange={handleChange}
            placeholder="products, store, shop"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Search Engine Options</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable SEO Friendly URLs"
            name="seoFriendlyUrls"
            checked={formData.seoFriendlyUrls || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Sitemap"
            name="enableSitemap"
            checked={formData.enableSitemap || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Schema Markup"
            name="enableSchema"
            checked={formData.enableSchema || false}
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

export default SEO;
