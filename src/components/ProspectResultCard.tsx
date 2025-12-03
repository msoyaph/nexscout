import { MessageSquare, FileText, TrendingUp, Save, RefreshCw, Flame, Heart, Zap } from 'lucide-react';
import ProspectAvatar from './ProspectAvatar';

interface ProspectResultCardProps {
  prospect: {
    id: string;
    prospectName: string;
    scoreSnapshot: number;
    bucketSnapshot: 'hot' | 'warm' | 'cold';
    painPoints: string[];
    personalityTraits: string[];
    sourcePlatform?: string;
    uploaded_image_url?: string | null;
    social_image_url?: string | null;
    avatar_seed?: string | null;
  };
  onGenerateMessage: () => void;
  onGenerateDeck: () => void;
  onAddToPipeline: () => void;
  onSaveToLibrary: () => void;
  onRescore: () => void;
}

export default function ProspectResultCard({
  prospect,
  onGenerateMessage,
  onGenerateDeck,
  onAddToPipeline,
  onSaveToLibrary,
  onRescore
}: ProspectResultCardProps) {
  const getBucketColor = () => {
    switch (prospect.bucketSnapshot) {
      case 'hot': return 'from-orange-500 to-red-500';
      case 'warm': return 'from-amber-500 to-orange-500';
      case 'cold': return 'from-blue-500 to-cyan-500';
    }
  };

  const getBucketIcon = () => {
    switch (prospect.bucketSnapshot) {
      case 'hot': return <Flame className="size-4" />;
      case 'warm': return <Heart className="size-4" />;
      case 'cold': return <Zap className="size-4" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <ProspectAvatar
          prospect={{
            id: prospect.id,
            full_name: prospect.prospectName,
            uploaded_image_url: prospect.uploaded_image_url,
            social_image_url: prospect.social_image_url,
            avatar_seed: prospect.avatar_seed
          }}
          size="md"
        />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">{prospect.prospectName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${getBucketColor()} text-white text-xs font-semibold`}>
              {getBucketIcon()}
              {prospect.bucketSnapshot.toUpperCase()}
            </div>
            <span className="text-sm font-bold text-gray-900">{prospect.scoreSnapshot}/100</span>
          </div>
        </div>
      </div>

      {prospect.painPoints.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Pain Points</p>
          <div className="flex flex-wrap gap-1.5">
            {prospect.painPoints.slice(0, 3).map((point, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      )}

      {prospect.personalityTraits.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Personality</p>
          <div className="flex flex-wrap gap-1.5">
            {prospect.personalityTraits.slice(0, 3).map((trait, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={onGenerateMessage}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        >
          <MessageSquare className="size-3" />
          Message
        </button>
        <button
          onClick={onGenerateDeck}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
        >
          <FileText className="size-3" />
          Deck
        </button>
        <button
          onClick={onAddToPipeline}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          <TrendingUp className="size-3" />
          Pipeline
        </button>
        <button
          onClick={onSaveToLibrary}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          <Save className="size-3" />
          Save
        </button>
      </div>

      <button
        onClick={onRescore}
        className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
      >
        <RefreshCw className="size-3" />
        Re-score with Updated AI
      </button>
    </div>
  );
}
