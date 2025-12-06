import { getProspectAvatar, ProspectAvatarData } from '../services/avatarService';
import { Sparkles, Shield, Users, Home, Star } from 'lucide-react';

interface ProspectAvatarProps {
  prospect?: ProspectAvatarData | null | undefined;
  uploadedImageUrl?: string | null;
  socialImageUrl?: string | null;
  avatarSeed?: string | null;
  fullName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  score?: number;
  bucket?: 'hot' | 'warm' | 'cold';
  userTier?: 'free' | 'pro' | 'elite';
  platform?: string;
  industry?: string;
  pipelineStage?: 'discover' | 'contacted' | 'warm' | 'closing';
  showBadges?: boolean;
  enableHover?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const badgeSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

export default function ProspectAvatar({
  prospect,
  uploadedImageUrl,
  socialImageUrl,
  avatarSeed,
  fullName,
  size = 'md',
  className = '',
  score,
  bucket,
  userTier = 'free',
  platform,
  industry,
  pipelineStage,
  showBadges = true,
  enableHover = true,
}: ProspectAvatarProps) {
  // Support both prospect object and individual props
  const prospectData = prospect || {
    uploaded_image_url: uploadedImageUrl,
    social_image_url: socialImageUrl,
    avatar_seed: avatarSeed,
    full_name: fullName,
  };

  const avatarUrl = getProspectAvatar(prospectData);
  const sizeClass = sizeClasses[size];
  const badgeSize = badgeSizes[size];

  // Determine bucket from score if not provided
  const determinedBucket = bucket || (score !== undefined
    ? (score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold')
    : 'warm');

  // Get ring color and glow based on bucket
  const getRingStyles = () => {
    switch (determinedBucket) {
      case 'hot':
        return 'ring-2 ring-[#FF4D4F] ring-offset-1';
      case 'warm':
        return 'ring-2 ring-[#FFC53D] ring-offset-1';
      case 'cold':
        return 'ring-2 ring-[#40A9FF] ring-offset-1';
      default:
        return '';
    }
  };

  // Get glow effect for Elite users
  const getGlowClass = () => {
    if (userTier !== 'pro') return '';

    switch (determinedBucket) {
      case 'hot':
        return 'avatar-glow-hot';
      case 'warm':
        return 'avatar-glow-warm';
      default:
        return '';
    }
  };

  // Get pipeline tint
  const getPipelineTint = () => {
    if (!pipelineStage) return '';

    switch (pipelineStage) {
      case 'contacted':
        return 'brightness-95 hue-rotate-[-5deg]';
      case 'warm':
        return 'brightness-105 saturate-110';
      case 'closing':
        return 'brightness-105 hue-rotate-[10deg]';
      default:
        return '';
    }
  };

  // Get platform badge icon
  const getPlatformBadge = () => {
    if (!showBadges || !platform) return null;

    const badgeColors: Record<string, string> = {
      facebook: 'bg-[#1877F2]',
      instagram: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]',
      linkedin: 'bg-[#0A66C2]',
      twitter: 'bg-[#1DA1F2]',
      tiktok: 'bg-black',
    };

    const color = badgeColors[platform.toLowerCase()] || 'bg-gray-500';

    return (
      <div
        className={`absolute -bottom-0.5 -right-0.5 ${badgeSize} ${color} rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shadow-sm`}
        title={`Source: ${platform}`}
      >
        {platform.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Get industry badge icon
  const getIndustryBadge = () => {
    if (!showBadges || !industry) return null;

    const industryIcons: Record<string, JSX.Element> = {
      insurance: <Shield className="w-full h-full" />,
      mlm: <Users className="w-full h-full" />,
      realestate: <Home className="w-full h-full" />,
      coaching: <Star className="w-full h-full" />,
    };

    const icon = industryIcons[industry.toLowerCase()];
    if (!icon) return null;

    return (
      <div
        className={`absolute -top-0.5 -right-0.5 ${badgeSize} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-white flex items-center justify-center text-white p-0.5 shadow-sm`}
        title={`Industry: ${industry}`}
      >
        {icon}
      </div>
    );
  };

  // Get AI sparkle for Elite users
  const getEliteSparkle = () => {
    if (userTier !== 'pro' || !showBadges) return null;

    return (
      <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full border border-white flex items-center justify-center shadow-lg animate-pulse">
        <Sparkles className="w-2.5 h-2.5 text-white" />
      </div>
    );
  };

  // Hover classes
  const hoverClasses = enableHover
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
    : '';

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClass} rounded-full overflow-hidden bg-slate-100`}>
        <img
          src={avatarUrl}
          alt={prospectData?.full_name || fullName || 'Prospect'}
          loading="lazy"
          className={`
            w-full h-full
            object-cover
            ${getRingStyles()}
            ${getGlowClass()}
            ${getPipelineTint()}
            ${hoverClasses}
          `}
        />
      </div>
      {getPlatformBadge()}
      {getIndustryBadge()}
      {getEliteSparkle()}
    </div>
  );
}
