import { CheckCircle2, Lock, TrendingUp } from 'lucide-react';
import type { TieredMission } from '../services/company/onboardingMissionsV2';
import { getCurrentReward, getUpgradeReward } from '../services/company/onboardingMissionsV2';

interface TieredMissionCardProps {
  mission: TieredMission;
  onComplete?: () => void;
  onUpgradeClick?: () => void;
}

export default function TieredMissionCard({
  mission,
  onComplete,
  onUpgradeClick,
}: TieredMissionCardProps) {
  const currentReward = getCurrentReward(mission);
  const tier = mission.userTier.toLowerCase();
  const isFree = tier === 'free';
  const isPro = tier === 'pro';

  const getTierBadge = (t: string) => {
    if (t === 'free') return { emoji: '🆓', label: 'Free', color: 'bg-slate-100 text-slate-700' };
    if (t === 'pro') return { emoji: '🟢', label: 'Pro', color: 'bg-green-100 text-green-700' };
    return { emoji: '🔵', label: 'Elite', color: 'bg-blue-100 text-blue-700' };
  };

  const userBadge = getTierBadge(tier);

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
        mission.isCompleted
          ? 'border-green-200 bg-green-50'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-2">{mission.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{mission.description}</p>
        </div>
        {mission.isCompleted && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="size-6 text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${userBadge.color}`}>
              {userBadge.emoji} {userBadge.label}
            </span>
            <span className="text-2xl font-bold text-blue-600">+{currentReward} coins</span>
          </div>
          {mission.isCompleted && (
            <span className="text-sm font-medium text-green-600">✓ Earned</span>
          )}
        </div>

        {!mission.isCompleted && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Reward comparison:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded ${
                    tier === 'free' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  🆓 +{mission.rewardFree}
                </span>
                <span className="text-slate-400">|</span>
                <span
                  className={`px-2 py-1 rounded ${
                    tier === 'pro' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  🟢 +{mission.rewardPro}
                </span>
                <span className="text-slate-400">|</span>
                <span
                  className={`px-2 py-1 rounded ${
                    tier === 'pro' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  🔵 +{mission.rewardElite}
                </span>
              </div>
            </div>

            {(isFree || isPro) && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="size-4 text-white" />
                  </div>
                  <div className="flex-1">
                    {isFree && (
                      <>
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          Upgrade to earn {mission.rewardPro - mission.rewardFree}× more!
                        </p>
                        <p className="text-xs text-amber-800">
                          Pro: +{mission.rewardPro} coins | Elite: +{mission.rewardElite} coins
                        </p>
                      </>
                    )}
                    {isPro && (
                      <>
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          Upgrade to Elite for VIP rewards!
                        </p>
                        <p className="text-xs text-amber-800">
                          Elite: +{mission.rewardElite} coins (+
                          {mission.rewardElite - mission.rewardPro} more)
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {onUpgradeClick && (
                  <button
                    onClick={onUpgradeClick}
                    className="mt-3 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 rounded-xl font-semibold text-sm hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    Upgrade & Earn More
                  </button>
                )}
              </div>
            )}

            {onComplete && !mission.isCompleted && (
              <button
                onClick={onComplete}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Complete Mission
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
