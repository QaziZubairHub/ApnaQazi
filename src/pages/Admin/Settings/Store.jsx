import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSettings } from '../../../hooks/useSettings';
import { useToast } from '../../../hooks/useToast';
import { logAuditEvent } from '../../../services/audit';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Toggle from '../../../components/ui/Toggle';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { validateStoreSettings } from '../../../utils/validators';

const Store = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('store');
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
    const validation = validateStoreSettings(formData);
    if (!validation.isValid) {
      showToast(validation.errors.join(', '), 'error');
      return;
    }

    setSaving(true);
    const oldData = { ...settings };
    const result = await updateSettings(formData);

    if (result.success) {
      showToast('Store settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'store', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Store Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Store Name"
            name="storeName"
            value={formData.storeName || ''}
            onChange={handleChange}
            placeholder="My Store"
          />
          <Input
            label="Store Email"
            name="storeEmail"
            type="email"
            value={formData.storeEmail || ''}
            onChange={handleChange}
            placeholder="store@example.com"
          />
          <Input
            label="Currency"
            name="currency"
            value={formData.currency || ''}
            onChange={handleChange}
            placeholder="USD"
          />
          <Input
            label="Timezone"
            name="timezone"
            value={formData.timezone || ''}
            onChange={handleChange}
            placeholder="UTC"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Store Features</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable Guest Checkout"
            name="guestCheckout"
            checked={formData.guestCheckout || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Product Reviews"
            name="productReviews"
            checked={formData.productReviews || false}
            onChange={handleChange}
          />
          <Toggle
            label="Enable Wishlist"
            name="wishlist"
            checked={formData.wishlist || false}
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

export default Store;
