import { ChevronRight, Image as ImageIcon, Flame, Calendar } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

interface ScanLibraryCardProps {
  session: {
    id: string;
    createdAt: string;
    socialSources: string[];
    filesCount: number;
    totalProspectsFound: number;
    hotCount: number;
    smartnessScoreAtScan?: number;
    status: string;
  };
  onClick: () => void;
}

export default function ScanLibraryCard({ session, onClick }: ScanLibraryCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-left"
    >
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <div className="text-center">
            <ImageIcon className="size-6 text-white mx-auto mb-1" />
            <span className="text-xs font-bold text-white">{session.filesCount}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="size-4 text-gray-500" />
            <span className="text-sm text-gray-600">{formatDistanceToNow(session.createdAt)}</span>
            {session.status === 'completed' && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                Complete
              </span>
            )}
            {session.status === 'processing' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                Processing
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {session.hotCount > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-full">
                <Flame className="size-4" />
                <span className="text-sm font-bold">{session.hotCount} Hot</span>
              </div>
            )}
            <span className="text-sm text-gray-700">
              {session.totalProspectsFound} total prospects found
            </span>
          </div>
        </div>

        <ChevronRight className="size-6 text-gray-400 shrink-0" />
      </div>
    </button>
  );
}
