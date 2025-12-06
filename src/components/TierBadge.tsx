import { Crown, Zap, Users, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_TIERS, TIER_PRICING } from '../lib/subscriptionTiers';

interface TierBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function TierBadge({ tier, size = 'md', showIcon = true, className = '' }: TierBadgeProps) {
  const pricing = TIER_PRICING[tier as keyof typeof TIER_PRICING];

  if (!pricing || tier === SUBSCRIPTION_TIERS.FREE) {
    return null;
  }

  const getIcon = () => {
    switch (tier) {
      case SUBSCRIPTION_TIERS.PRO:
        return Crown;
      case SUBSCRIPTION_TIERS.TEAM:
        return Users;
      default:
        return Sparkles;
    }
  };

  const Icon = getIcon();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  const iconSizes = {
    sm: 'size-3',
    md: 'size-3.5',
    lg: 'size-4'
  };

  const baseClasses = `inline-flex items-center font-bold rounded-full ${sizeClasses[size]}`;

  const tierClasses = {
    [SUBSCRIPTION_TIERS.PRO]: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    [SUBSCRIPTION_TIERS.TEAM]: 'bg-green-600 text-white',
    [SUBSCRIPTION_TIERS.FREE]: 'bg-slate-600 text-white'
  };

  return (
    <span className={`${baseClasses} ${tierClasses[tier as keyof typeof tierClasses]} ${className}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{pricing.displayName}</span>
    </span>
  );
}
