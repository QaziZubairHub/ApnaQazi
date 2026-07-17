import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { logAuditEvent } from '../../services/audit';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Toggle from '../../components/ui/Toggle';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('dashboard');
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
      showToast('Dashboard settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'dashboard', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard Configuration</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable Real-time Updates"
            name="realtimeUpdates"
            checked={formData.realtimeUpdates || false}
            onChange={handleChange}
          />
          <Toggle
            label="Show Revenue Chart"
            name="showRevenueChart"
            checked={formData.showRevenueChart !== false}
            onChange={handleChange}
          />
          <Toggle
            label="Show Order Pipeline"
            name="showOrderPipeline"
            checked={formData.showOrderPipeline !== false}
            onChange={handleChange}
          />
          <Toggle
            label="Show Activity Feed"
            name="showActivityFeed"
            checked={formData.showActivityFeed !== false}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Refresh Settings</h2>
        <div className="space-y-4">
          <Input
            label="Auto Refresh Interval (seconds)"
            name="refreshInterval"
            type="number"
            value={formData.refreshInterval || '30'}
            onChange={handleChange}
            placeholder="30"
          />
          <Toggle
            label="Enable Auto Refresh"
            name="autoRefresh"
            checked={formData.autoRefresh || false}
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

export default Dashboard;
