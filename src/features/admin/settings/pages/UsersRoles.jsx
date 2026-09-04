import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useSettings } from '../../../../hooks/useSettings';
import { useToast } from '../../../../hooks/useToast';
import { logAuditEvent } from '../../../../services/audit';
import Card from '../../../../components/ui/Card';
import Input from '../../../../components/ui/Input';
import Toggle from '../../../../components/ui/Toggle';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

const UsersRoles = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('users-roles');
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
      showToast('Users & Roles settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'users-roles', oldData, formData);
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
      <h1 className="text-2xl font-bold text-gray-900">Users & Roles Settings</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">User Management</h2>
        <div className="space-y-4">
          <Toggle
            label="Enable User Registration"
            name="enableRegistration"
            checked={formData.enableRegistration || false}
            onChange={handleChange}
          />
          <Toggle
            label="Require Email Verification"
            name="requireEmailVerification"
            checked={formData.requireEmailVerification || false}
            onChange={handleChange}
          />
          <Toggle
            label="Allow Profile Editing"
            name="allowProfileEditing"
            checked={formData.allowProfileEditing !== false}
            onChange={handleChange}
          />
          <Input
            label="Default User Role"
            name="defaultRole"
            value={formData.defaultRole || 'user'}
            onChange={handleChange}
            placeholder="user"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Role Permissions</h2>
        <div className="space-y-4">
          <Toggle
            label="Admins Can Manage Users"
            name="adminsManageUsers"
            checked={formData.adminsManageUsers || false}
            onChange={handleChange}
          />
          <Toggle
            label="Users Can View Own Orders"
            name="usersViewOwnOrders"
            checked={formData.usersViewOwnOrders !== false}
            onChange={handleChange}
          />
          <Toggle
            label="Users Can Cancel Own Orders"
            name="usersCancelOwnOrders"
            checked={formData.usersCancelOwnOrders || false}
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

export default UsersRoles;
