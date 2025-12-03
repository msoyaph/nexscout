import { ArrowLeft, Star, Lock, Zap, Users, TrendingUp } from 'lucide-react';

interface ProspectsPreviewPageProps {
  onCreateAccount: () => void;
  onBack: () => void;
}

interface Prospect {
  id: number;
  name: string;
  image: string;
  score: number;
  platform: string;
  platformColor: string;
  description: string;
  badge: 'HOT' | 'WARM' | 'GOOD';
  badgeColor: string;
  locked: boolean;
  blurLevel: number;
}

const prospects: Prospect[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    image: 'https://randomuser.me/api/portraits/women/32.jpg',
    score: 95,
    platform: 'Facebook',
    platformColor: '#1877F2',
    description: 'Recently posted about looking for business automation tools. Strong engagement with tech content.',
    badge: 'HOT',
    badgeColor: 'green',
    locked: false,
    blurLevel: 0,
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    image: 'https://randomuser.me/api/portraits/men/45.jpg',
    score: 82,
    platform: 'Instagram',
    platformColor: '#E4405F',
    description: 'Active in entrepreneur groups. Posted about scaling his online business last week.',
    badge: 'WARM',
    badgeColor: 'amber',
    locked: false,
    blurLevel: 0,
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    score: 78,
    platform: 'LinkedIn',
    platformColor: '#0A66C2',
    description: 'Marketing director interested in AI tools. Engaged with similar products recently.',
    badge: 'GOOD',
    badgeColor: 'blue',
    locked: false,
    blurLevel: 0,
  },
  {
    id: 4,
    name: 'James Wilson',
    image: 'https://randomuser.me/api/portraits/men/22.jpg',
    score: 91,
    platform: 'Twitter',
    platformColor: '#1DA1F2',
    description: 'CEO actively discussing sales automation challenges',
    badge: 'HOT',
    badgeColor: 'green',
    locked: true,
    blurLevel: 8,
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    image: 'https://randomuser.me/api/portraits/women/55.jpg',
    score: 85,
    platform: 'Facebook',
    platformColor: '#1877F2',
    description: 'Small business owner looking for lead generation',
    badge: 'WARM',
    badgeColor: 'amber',
    locked: true,
    blurLevel: 10,
  },
  {
    id: 6,
    name: 'David Kim',
    image: 'https://randomuser.me/api/portraits/men/71.jpg',
    score: 88,
    platform: 'Instagram',
    platformColor: '#E4405F',
    description: 'Influencer interested in marketing automation',
    badge: 'HOT',
    badgeColor: 'green',
    locked: true,
    blurLevel: 12,
  },
  {
    id: 7,
    name: 'Rachel Green',
    image: 'https://randomuser.me/api/portraits/women/29.jpg',
    score: 76,
    platform: 'LinkedIn',
    platformColor: '#0A66C2',
    description: 'Sales manager exploring new prospecting tools',
    badge: 'GOOD',
    badgeColor: 'blue',
    locked: true,
    blurLevel: 14,
  },
];

const getBadgeStyles = (color: string) => {
  const styles = {
    green: 'bg-green-100 border-green-300 text-green-700',
    amber: 'bg-amber-100 border-amber-300 text-amber-700',
    blue: 'bg-blue-100 border-blue-300 text-blue-700',
  };
  return styles[color as keyof typeof styles] || styles.blue;
};

const getScoreStyles = (color: string) => {
  const styles = {
    green: 'bg-green-100 border-green-300 text-green-700',
    amber: 'bg-amber-100 border-amber-300 text-amber-700',
    blue: 'bg-blue-100 border-blue-300 text-blue-700',
  };
  return styles[color as keyof typeof styles] || styles.blue;
};

export default function ProspectsPreviewPage({ onCreateAccount, onBack }: ProspectsPreviewPageProps) {
  const totalProspects = 233;
  const hotLeads = 47;
  const warmLeads = 86;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-11 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="size-6 text-gray-600" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Your Prospects</h1>
          <p className="text-xs text-green-600 font-medium">
            AI has found your best opportunities
          </p>
        </div>
        <div className="size-11" />
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-green-50 border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Users className="size-5 text-nexscout-blue" />
          <h2 className="text-2xl font-bold text-gray-900">{totalProspects}</h2>
          <span className="text-sm text-gray-600">Connections Found</span>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-700">{hotLeads} Hot Leads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-700">{warmLeads} Warm Leads</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-32">
        <div className="space-y-2.5">
          {prospects.map((prospect) => (
            <div
              key={prospect.id}
              className={`relative ${
                prospect.badge === 'HOT' && !prospect.locked
                  ? 'bg-white rounded-lg p-3 border-2 border-green-300 shadow-lg'
                  : 'bg-white rounded-lg p-3 border border-gray-200 shadow-sm'
              }`}
              style={prospect.locked ? { filter: `blur(${prospect.blurLevel}px)` } : {}}
            >
              {prospect.badge === 'HOT' && !prospect.locked && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent rounded-lg pointer-events-none" />
              )}

              {prospect.locked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-white/90 p-2 rounded-full border border-nexscout-blue shadow-lg">
                    <Lock className="size-5 text-nexscout-blue" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 relative">
                <img
                  src={prospect.image}
                  alt={prospect.name}
                  className={`size-12 rounded-full flex-shrink-0 ${
                    prospect.badge === 'HOT' && !prospect.locked
                      ? 'border-2 border-green-400 shadow-lg'
                      : 'border border-gray-200'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-sm font-semibold text-gray-900">{prospect.name}</h3>
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border ${getScoreStyles(prospect.badgeColor)}`}>
                      <Star className="size-2.5" fill="currentColor" />
                      <span className="text-[10px] font-bold">{prospect.score}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div
                      className="size-3.5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: prospect.platformColor }}
                    >
                      <span className="text-[7px] text-white font-bold">
                        {prospect.platform[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-600">{prospect.platform}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-snug line-clamp-2">
                    {prospect.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`px-2 py-0.5 rounded-full ${getBadgeStyles(prospect.badgeColor)}`}>
                    <span className="text-[10px] font-bold">{prospect.badge}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-6 px-4 space-y-3 border-t border-gray-200 shadow-lg">
        <button
          onClick={onCreateAccount}
          className="w-full py-4 bg-gradient-to-r from-nexscout-blue via-green-500 to-nexscout-blue text-white rounded-xl font-semibold text-base shadow-xl relative overflow-hidden hover:shadow-2xl transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          <span className="relative">Create Account to See All Prospects</span>
        </button>
        <p className="text-sm text-gray-600 text-center">
          Unlock full AI insights and unlimited scans
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Zap className="size-5 text-green-500" fill="currentColor" />
          <p className="text-xs text-gray-600">Join 30,821 agents finding hot leads daily</p>
        </div>
      </div>
    </div>
  );
}
