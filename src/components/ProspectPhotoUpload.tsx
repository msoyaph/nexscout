import { useState, useRef } from 'react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { uploadProspectPhoto, deleteProspectPhoto, ProspectAvatarData } from '../services/avatarService';
import ProspectAvatar from './ProspectAvatar';

interface ProspectPhotoUploadProps {
  prospect: ProspectAvatarData;
  userId: string;
  onUploadSuccess?: (url: string) => void;
  onDeleteSuccess?: () => void;
}

export default function ProspectPhotoUpload({
  prospect,
  userId,
  onUploadSuccess,
  onDeleteSuccess,
}: ProspectPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const result = await uploadProspectPhoto(prospect.id, userId, file);

    setUploading(false);

    if (result.success && result.url) {
      onUploadSuccess?.(result.url);
    } else {
      setError(result.error || 'Upload failed');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!prospect.uploaded_image_url) return;
    if (!confirm('Delete this photo? The prospect will revert to their default avatar.')) return;

    setError(null);
    setDeleting(true);

    const result = await deleteProspectPhoto(prospect.id, userId);

    setDeleting(false);

    if (result.success) {
      onDeleteSuccess?.();
    } else {
      setError(result.error || 'Delete failed');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <ProspectAvatar prospect={prospect} size="xl" />
        <button
          onClick={handleUploadClick}
          disabled={uploading || deleting}
          className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50"
          title="Upload photo"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleUploadClick}
          disabled={uploading || deleting}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>

        {prospect.uploaded_image_url && (
          <button
            onClick={handleDelete}
            disabled={uploading || deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center max-w-xs">
        Upload PNG, JPG, or WebP (max 5MB). Photos are stored securely and only visible to you.
      </p>
    </div>
  );
}
