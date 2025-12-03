import { LucideIcon, Lock } from 'lucide-react';

interface SocialConnectCardProps {
  icon: LucideIcon;
  platform: string;
  connected: boolean;
  locked?: boolean;
  onConnect: () => void;
}

export default function SocialConnectCard({
  icon: Icon,
  platform,
  connected,
  locked = false,
  onConnect
}: SocialConnectCardProps) {
  return (
    <button
      onClick={onConnect}
      disabled={locked}
      className={`relative bg-white rounded-2xl p-4 border-2 transition-all text-center ${
        connected
          ? 'border-green-500 bg-green-50'
          : locked
          ? 'border-gray-200 cursor-not-allowed opacity-60'
          : 'border-gray-200 hover:border-blue-500 hover:shadow-lg'
      }`}
    >
      {locked && (
        <div className="absolute top-2 right-2">
          <Lock className="size-3 text-gray-400" />
        </div>
      )}

      <div className={`size-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${
        connected
          ? 'bg-green-500'
          : locked
          ? 'bg-gray-300'
          : 'bg-gradient-to-br from-blue-500 to-purple-600'
      }`}>
        <Icon className="size-5 text-white" />
      </div>

      <h4 className="text-xs font-bold text-gray-900 mb-1">{platform}</h4>

      {connected ? (
        <div className="flex items-center justify-center gap-1">
          <div className="size-2 rounded-full bg-green-500" />
          <span className="text-xs text-green-700 font-semibold">Connected</span>
        </div>
      ) : (
        <span className="text-xs text-gray-600">{locked ? 'Pro' : 'Connect'}</span>
      )}
    </button>
  );
}
