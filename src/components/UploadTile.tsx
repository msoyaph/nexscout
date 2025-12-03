import { LucideIcon, Info, Lock } from 'lucide-react';

interface UploadTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  multiUpload?: boolean;
  locked?: boolean;
  badge?: string;
}

export default function UploadTile({
  icon: Icon,
  title,
  description,
  onClick,
  multiUpload = false,
  locked = false,
  badge
}: UploadTileProps) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`relative w-full p-6 rounded-2xl border-2 transition-all text-left ${
        locked
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          : 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg'
      }`}
    >
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-semibold">
            <Lock className="size-3" />
            {badge}
          </span>
        </div>
      )}

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-2xl">
          <div className="text-center">
            <Lock className="size-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">Upgrade to unlock</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`size-14 rounded-xl flex items-center justify-center shrink-0 ${
          locked ? 'bg-gray-200' : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          <Icon className={`size-7 ${locked ? 'text-gray-400' : 'text-white'}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{title}</h3>
            {multiUpload && (
              <div className="group relative">
                <Info className="size-4 text-blue-500" />
                <div className="absolute left-0 top-6 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                    Supports multiple uploads
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
}
