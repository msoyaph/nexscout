import { LucideIcon } from 'lucide-react';

interface UploadCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  selectedCount?: number;
  variant?: 'default' | 'small';
}

export default function UploadCard({
  icon: Icon,
  title,
  description,
  onClick,
  selectedCount,
  variant = 'default'
}: UploadCardProps) {
  if (variant === 'small') {
    return (
      <button
        onClick={onClick}
        className="relative bg-white rounded-2xl p-4 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-center group"
      >
        <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-2">
          <Icon className="size-5 text-white" />
        </div>
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        {selectedCount !== undefined && selectedCount > 0 && (
          <div className="absolute -top-2 -right-2 size-6 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{selectedCount}</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
    >
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Icon className="size-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          {selectedCount !== undefined && selectedCount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
              {selectedCount} selected
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
