import { useState, useRef } from 'react';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

const ImageUploader = ({ mainImage, galleryImages, onMainImageChange, onGalleryChange }) => {
  const { uploadImage, deleteImage, loading } = useStorage();
  const { showToast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [galleryDragOver, setGalleryDragOver] = useState(false);
  const mainInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleUpload = async (files, isMain = false) => {
    if (!files || files.length === 0) return;
    try {
      const uploadPromises = Array.from(files).map((file) => uploadImage(file, 'products'));
      const urls = await Promise.all(uploadPromises);
      if (isMain) {
        onMainImageChange(urls[0]);
      } else {
        onGalleryChange([...(galleryImages || []), ...urls]);
      }
      showToast(`${urls.length} image(s) uploaded successfully`, 'success');
    } catch (error) {
      showToast('Failed to upload images', 'error');
    }
  };

  const handleDelete = async (url, isMain = false) => {
    try {
      await deleteImage(url);
      if (isMain) {
        onMainImageChange(null);
      } else {
        onGalleryChange(galleryImages.filter((img) => img !== url));
      }
      showToast('Image deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete image', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Main Image</label>
        <div className="flex items-center gap-4">
          {mainImage ? (
            <div className="relative group">
              <img src={mainImage} alt="Main" className="h-24 w-24 rounded-[12px] object-cover border border-slate-200" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[12px] flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => mainInputRef.current?.click()}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(mainImage, true)}
                  className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`h-24 w-24 rounded-[12px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files, true); }}
              onClick={() => mainInputRef.current?.click()}
            >
              {loading ? <LoadingSpinner size="sm" /> : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </div>
          )}
          <input
            ref={mainInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files, true)}
            className="hidden"
          />
        </div>
      </div>

      {/* Gallery Images */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Images</label>
        <div
          className={`rounded-[12px] border-2 border-dashed p-6 transition-colors ${
            galleryDragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setGalleryDragOver(true); }}
          onDragLeave={() => setGalleryDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setGalleryDragOver(false); handleUpload(e.dataTransfer.files); }}
        >
          <div className="flex flex-wrap gap-3">
            {(galleryImages || []).map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt={`Gallery ${index + 1}`} className="h-20 w-20 rounded-[10px] object-cover border border-slate-200" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[10px] flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(url)}
                    className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <div
              className="h-20 w-20 rounded-[10px] border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => galleryInputRef.current?.click()}
            >
              {loading ? <LoadingSpinner size="sm" /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </div>
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
          <p className="text-xs text-slate-500 mt-3">Drag & drop images here or click to browse. Supports multiple uploads.</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
