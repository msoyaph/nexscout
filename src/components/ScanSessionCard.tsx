import { ChevronRight, Flame, Facebook, Instagram, Linkedin, Twitter, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

interface ScanSessionCardProps {
  session: {
    id: string;
    createdAt: string;
    socialSources: string[];
    filesCount: number;
    totalProspectsFound: number;
    hotCount: number;
    smartnessScoreAtScan: number;
    status: string;
  };
  onClick: () => void;
}

export default function ScanSessionCard({ session, onClick }: ScanSessionCardProps) {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="size-4 text-blue-600" />;
      case 'instagram': return <Instagram className="size-4 text-pink-600" />;
      case 'linkedin': return <Linkedin className="size-4 text-blue-700" />;
      case 'twitter': return <Twitter className="size-4 text-blue-500" />;
      case 'tiktok': return <ImageIcon className="size-4 text-gray-600" />;
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-500 hover:shadow-lg transition-all text-left"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">
            Scan {formatDistanceToNow(session.createdAt)}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(session.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <ChevronRight className="size-5 text-gray-400" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        {session.socialSources.length > 0 ? (
          session.socialSources.map((platform, idx) => (
            <div key={idx} className="size-8 rounded-lg bg-gray-100 flex items-center justify-center">
              {getSocialIcon(platform)}
            </div>
          ))
        ) : (
          <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <ImageIcon className="size-4 text-gray-600" />
          </div>
        )}
        {session.filesCount > 0 && (
          <span className="text-xs text-gray-600">
            +{session.filesCount} files
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-600">Prospects</p>
          <p className="text-lg font-bold text-gray-900">{session.totalProspectsFound}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2">
          <p className="text-xs text-orange-600 flex items-center gap-1">
            <Flame className="size-3" />
            Hot
          </p>
          <p className="text-lg font-bold text-orange-600">{session.hotCount}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-xs text-blue-600">AI Score</p>
          <p className="text-lg font-bold text-blue-600">{session.smartnessScoreAtScan}%</p>
        </div>
      </div>

      {session.status !== 'completed' && (
        <div className="mt-3 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold inline-block">
          {session.status === 'processing' ? 'Processing...' : 'Pending'}
        </div>
      )}
    </button>
  );
}
