import { ArrowRight, Clock, Flame, Image, FileText, Type, Facebook } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

interface RecentScanCardProps {
  id: string;
  sourceType: string;
  fileCount: number;
  createdAt: string;
  hotLeadsFound: number;
  status: string;
  onClick: () => void;
}

export default function RecentScanCard({
  id,
  sourceType,
  fileCount,
  createdAt,
  hotLeadsFound,
  status,
  onClick
}: RecentScanCardProps) {
  const getSourceIcon = () => {
    switch (sourceType) {
      case 'screenshot':
        return <Image className="size-5 text-blue-600" />;
      case 'file':
        return <FileText className="size-5 text-green-600" />;
      case 'text':
        return <Type className="size-5 text-purple-600" />;
      case 'fb':
        return <Facebook className="size-5 text-blue-700" />;
      default:
        return <FileText className="size-5 text-gray-600" />;
    }
  };

  const getSourceLabel = () => {
    switch (sourceType) {
      case 'screenshot':
        return 'Screenshots';
      case 'file':
        return 'Files';
      case 'text':
        return 'Pasted Text';
      case 'fb':
        return 'Facebook';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
            {getSourceIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{getSourceLabel()}</h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
              <span>{fileCount} {fileCount === 1 ? 'item' : 'items'}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatDistanceToNow(createdAt)}
              </div>
            </div>

            {hotLeadsFound > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Flame className="size-4 text-orange-500" />
                <span className="font-semibold text-orange-600">
                  {hotLeadsFound} hot {hotLeadsFound === 1 ? 'lead' : 'leads'} found
                </span>
              </div>
            )}
          </div>
        </div>

        <ArrowRight className="size-5 text-gray-400 shrink-0 mt-2" />
      </div>
    </button>
  );
}
