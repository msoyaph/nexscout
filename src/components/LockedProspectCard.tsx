import { Lock, Sparkles } from 'lucide-react';

interface LockedProspectCardProps {
  position: number;
  onUnlockClick: () => void;
}

export default function LockedProspectCard({ position, onUnlockClick }: LockedProspectCardProps) {
  return (
    <div className="relative bg-white rounded-[32px] shadow-lg border-2 border-slate-200 overflow-hidden h-[500px]">
      <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-slate-50/95 to-slate-100/95" />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 blur-2xl opacity-50 animate-pulse" />
          <div className="relative size-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl">
            <Lock className="size-10 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            Prospect #{position} Locked
          </h3>
          <p className="text-sm text-slate-600 max-w-xs">
            Upgrade to see more high-quality prospects or use coins to unlock
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={onUnlockClick}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-[16px] font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="size-5" />
              <span>Upgrade to Pro</span>
            </div>
          </button>

          <button className="w-full py-3 px-6 bg-white border-2 border-amber-400 text-amber-700 rounded-[16px] font-semibold shadow-md hover:shadow-lg transition-all">
            Unlock with 10 Coins
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <div className="size-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs text-slate-500 font-medium">
            Premium prospect waiting
          </p>
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 animate-pulse" />
    </div>
  );
}
