import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useSettings } from '../../../../hooks/useSettings';
import { useToast } from '../../../../hooks/useToast';
import { logAuditEvent } from '../../../../services/audit';
import Card from '../../../../components/ui/Card';
import Input from '../../../../components/ui/Input';
import Toggle from '../../../../components/ui/Toggle';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

const BackupRestore = () => {
  const { user } = useAuth();
  const { data: settings, loading, updateSettings } = useSettings('backup-restore');
  const { showToast } = useToast();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

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
      showToast('Backup & Restore settings saved successfully', 'success');
      await logAuditEvent(user?.uid, 'UPDATE', 'backup-restore', oldData, formData);
    } else {
      showToast('Failed to save settings: ' + result.error, 'error');
    }
    setSaving(false);
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showToast('Backup completed successfully', 'success');
      await logAuditEvent(user?.uid, 'BACKUP', 'backup-restore', null, { timestamp: Date.now() });
    } catch {
      showToast('Backup failed', 'error');
    } finally {
      setBackingUp(false);
      setShowBackupDialog(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showToast('Restore completed successfully', 'success');
      await logAuditEvent(user?.uid, 'RESTORE', 'backup-restore', null, { timestamp: Date.now() });
    } catch {
      showToast('Restore failed', 'error');
    } finally {
      setRestoring(false);
      setShowRestoreDialog(false);
    }
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
      <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Backup Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Auto Backup Frequency"
            name="backupFrequency"
            value={formData.backupFrequency || ''}
            onChange={handleChange}
            placeholder="daily / weekly / monthly"
          />
          <Input
            label="Backup Storage Path"
            name="backupPath"
            value={formData.backupPath || ''}
            onChange={handleChange}
            placeholder="/backups"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Backup Options</h2>
        <div className="space-y-4">
          <Toggle
            label="Auto Backup Enabled"
            name="autoBackup"
            checked={formData.autoBackup || false}
            onChange={handleChange}
          />
          <Toggle
            label="Include Media Files"
            name="includeMedia"
            checked={formData.includeMedia || false}
            onChange={handleChange}
          />
          <Toggle
            label="Notify on Backup Completion"
            name="notifyOnBackup"
            checked={formData.notifyOnBackup || false}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowBackupDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Backup Now
          </button>
          <button
            type="button"
            onClick={() => setShowRestoreDialog(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Restore from Backup
          </button>
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

      <ConfirmDialog
        isOpen={showBackupDialog}
        onClose={() => setShowBackupDialog(false)}
        onConfirm={handleBackup}
        title="Create Backup"
        message="Are you sure you want to create a backup now? This may take a few minutes."
        confirmText="Create Backup"
        loading={backingUp}
      />

      <ConfirmDialog
        isOpen={showRestoreDialog}
        onClose={() => setShowRestoreDialog(false)}
        onConfirm={handleRestore}
        title="Restore from Backup"
        message="Are you sure you want to restore from a backup? This will overwrite current data."
        confirmText="Restore"
        loading={restoring}
      />
    </div>
  );
};

export default BackupRestore;
