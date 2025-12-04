import { X, File, Image, FileText } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  preview?: string;
  size: number;
}

interface MultiUploadGridProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

export default function MultiUploadGrid({ files, onRemove }: MultiUploadGridProps) {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type === 'text/csv' || type === 'text/plain') return FileText;
    return File;
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">
          Selected Files ({files.length})
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {files.map((file) => {
          const FileIcon = getFileIcon(file.type);
          const isImage = file.type.startsWith('image/');

          return (
            <div
              key={file.id}
              className="relative bg-white rounded-xl border border-gray-200 overflow-hidden group"
            >
              <button
                onClick={() => onRemove(file.id)}
                className="absolute top-2 right-2 z-10 size-6 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="size-4 text-white" />
              </button>

              {isImage && file.preview ? (
                <div className="h-24 bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <FileIcon className="size-12 text-blue-600" />
                </div>
              )}

              <div className="p-3">
                <p className="text-xs font-medium text-gray-900 truncate mb-1">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
