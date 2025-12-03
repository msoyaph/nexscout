import { LucideIcon, Lock } from 'lucide-react';

interface ScanSourceTileProps {
  icon: LucideIcon;
  title: string;
  platform: string;
  onClick: () => void;
  locked?: boolean;
  selected?: boolean;
}

export default function ScanSourceTile({
  icon: Icon,
  title,
  platform,
  onClick,
  locked = false,
  selected = false
}: ScanSourceTileProps) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`relative p-4 rounded-xl border-2 transition-all text-center ${
        selected
          ? 'border-blue-600 bg-blue-50 shadow-lg'
          : locked
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          : 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg'
      }`}
    >
      {locked && (
        <div className="absolute top-2 right-2">
          <Lock className="size-4 text-gray-400" />
        </div>
      )}

      <div className={`size-12 rounded-lg mx-auto mb-2 flex items-center justify-center ${
        locked ? 'bg-gray-200' : 'bg-gradient-to-br from-blue-500 to-blue-600'
      }`}>
        <Icon className={`size-6 ${locked ? 'text-gray-400' : 'text-white'}`} />
      </div>

      <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
      <p className="text-xs text-gray-600 mt-0.5">{platform}</p>

      {selected && (
        <div className="absolute -top-2 -right-2 size-6 rounded-full bg-blue-600 flex items-center justify-center">
          <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
