import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ImageUpload = ({ label, value, onChange, folder = 'settings' }) => {
  const [uploading, setUploading] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      onChange(url);
    } catch (error) {
      console.error('Upload failed:', error?.code, error?.message, error);
      if (error?.code && error.code.startsWith('storage/')) setStorageUnavailable(true);
      toast.error('Image upload is unavailable because Firebase Storage is not enabled.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center space-x-4">
        {value && (
          <img src={value} alt={label} className="w-16 h-16 object-cover rounded border" />
        )}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploading || storageUnavailable}
          />
          {uploading && <LoadingSpinner size="sm" className="mt-2" />}
          {storageUnavailable && <p className="text-xs text-amber-600 mt-2">Image upload is unavailable (Firebase Storage not enabled).</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
