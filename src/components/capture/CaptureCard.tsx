import { ChevronRight } from 'lucide-react';
import CaptureTag from './CaptureTag';

interface CaptureCardProps {
  id: string;
  platform: string;
  captureType: string;
  createdAt: string;
  tags: string[];
  textContent: string | null;
  onClick: () => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-500 text-white',
  instagram: 'bg-pink-500 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-sky-500 text-white',
  tiktok: 'bg-black text-white',
  other: 'bg-gray-500 text-white',
};

export default function CaptureCard({
  id,
  platform,
  captureType,
  createdAt,
  tags,
  textContent,
  onClick,
}: CaptureCardProps) {
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function truncateText(text: string | null, maxLength: number): string {
    if (!text) return 'No preview available';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              PLATFORM_COLORS[platform] || PLATFORM_COLORS.other
            }`}
          >
            {platform.toUpperCase()}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {captureType.replace(/_/g, ' ')}
          </span>
        </div>
        <ChevronRight className="size-5 text-gray-400" />
      </div>

      <p className="text-sm text-gray-600 mb-3">{formatDate(createdAt)}</p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.slice(0, 3).map((tag, idx) => (
            <CaptureTag key={idx} tag={tag} />
          ))}
          {tags.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <p className="text-sm text-gray-700 line-clamp-2">{truncateText(textContent, 150)}</p>
    </button>
  );
}
