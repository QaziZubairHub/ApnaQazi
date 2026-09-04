import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useSettings } from '../../../../hooks/useSettings';
import { useToast } from '../../../../hooks/useToast';
import { logAuditEvent } from '../../../../services/audit';
import Card from '../../../../components/ui/Card';
import Input from '../../../../components/ui/Input';
import Toggle from '../../../../components/ui/Toggle';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

const Invoice = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('invoice');
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
      showToast('Invoice settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'invoice', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">Invoice Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Invoice Prefix"
            name="prefix"
            value={formData.prefix || ''}
            onChange={handleChange}
            placeholder="INV-"
          />
          <Input
            label="Starting Number"
            name="startingNumber"
            type="number"
            value={formData.startingNumber || ''}
            onChange={handleChange}
            placeholder="1001"
          />
          <Input
            label="Tax Rate (%)"
            name="taxRate"
            type="number"
            value={formData.taxRate || ''}
            onChange={handleChange}
            placeholder="10"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Options</h2>
        <div className="space-y-4">
          <Toggle
            label="Auto-generate Invoices"
            name="autoGenerate"
            checked={formData.autoGenerate || false}
            onChange={handleChange}
          />
          <Toggle
            label="Send Invoice via Email"
            name="sendEmail"
            checked={formData.sendEmail || false}
            onChange={handleChange}
          />
          <Toggle
            label="Show Company Logo"
            name="showLogo"
            checked={formData.showLogo || false}
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

export default Invoice;
