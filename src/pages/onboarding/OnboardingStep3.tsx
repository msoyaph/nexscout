import { useState } from 'react';
import { ShieldCheck, ChevronLeft, AlertCircle } from 'lucide-react';

interface OnboardingStep3Props {
  onFinish: (connectedPlatforms: string[]) => void;
  onSkip: () => void;
  onBack: () => void;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  buttonColor: string;
}

const platforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'mdi:facebook',
    color: '#1877F2',
    bgColor: 'bg-blue-500/10',
    buttonColor: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'mdi:instagram',
    color: 'linear-gradient(to br, #F56040, #C13584)',
    bgColor: 'bg-gradient-to-br from-pink-500 to-purple-600 opacity-80',
    buttonColor: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'ic:baseline-tiktok',
    color: '#00F2EA',
    bgColor: 'bg-black',
    buttonColor: 'bg-black border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10',
  },
  {
    id: 'twitter',
    name: 'X',
    icon: 'mdi:twitter',
    color: '#1A1A1A',
    bgColor: 'bg-gray-900/10',
    buttonColor: 'bg-gray-900 hover:opacity-90',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'mdi:linkedin',
    color: '#0A66C2',
    bgColor: 'bg-blue-600/10',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
];

export default function OnboardingStep3({ onFinish, onSkip, onBack }: OnboardingStep3Props) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);

  const handleConnect = (platformId: string) => {
    setShowError(false);
    if (connectedPlatforms.includes(platformId)) {
      if (platformId === 'facebook') {
        return;
      }
      setConnectedPlatforms(connectedPlatforms.filter((p) => p !== platformId));
    } else {
      setConnectedPlatforms([...connectedPlatforms, platformId]);
    }
  };

  const handleFinish = () => {
    if (!connectedPlatforms.includes('facebook')) {
      setShowError(true);
      return;
    }
    onFinish(connectedPlatforms);
  };

  const isFacebookConnected = connectedPlatforms.includes('facebook');

  return (
    <div className="bg-white min-h-screen text-gray-900 relative overflow-hidden flex flex-col">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-100 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50 via-transparent to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col px-6 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Step 3 of 3</span>
            <span className="text-sm font-medium text-nexscout-blue">100%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-full bg-nexscout-blue rounded-full shadow-[0_0_12px_rgba(37,99,235,0.6)] transition-all duration-500" />
          </div>
        </div>

        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Connect Your Accounts
        </h1>
        <p className="text-base text-gray-600 mb-2">
          Link your social platforms to get started
        </p>
        <p className="text-sm text-nexscout-blue font-medium mb-8">
          Facebook is required to analyze your network
        </p>

        {showError && (
          <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Please connect your Facebook account to continue</span>
          </div>
        )}

        <div className="flex-1 mb-6 space-y-4">
          {platforms.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform.id);

            return (
              <div key={platform.id} className="relative">
                <div className="relative w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-soft flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center size-12 rounded-xl ${platform.bgColor}`}>
                      <svg className="size-6" viewBox="0 0 24 24">
                        {platform.id === 'facebook' && (
                          <path
                            fill={platform.color}
                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                          />
                        )}
                        {platform.id === 'instagram' && (
                          <path
                            fill="white"
                            d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                          />
                        )}
                        {platform.id === 'tiktok' && (
                          <path
                            fill="#00F2EA"
                            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                          />
                        )}
                        {platform.id === 'twitter' && (
                          <path
                            fill={platform.color}
                            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                          />
                        )}
                        {platform.id === 'linkedin' && (
                          <path
                            fill={platform.color}
                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                          />
                        )}
                      </svg>
                    </div>
                    <span className="text-base font-semibold text-gray-900">
                      {platform.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={platform.id === 'facebook' && isConnected}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isConnected
                        ? 'bg-green-500 text-white'
                        : `${platform.buttonColor} text-white`
                    } ${platform.id === 'facebook' && isConnected ? 'cursor-not-allowed' : ''}`}
                  >
                    {isConnected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-xl bg-gray-50">
          <ShieldCheck className="size-5 text-green-500" />
          <span className="text-sm text-gray-600">
            We never post without permission
          </span>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleFinish}
            className="w-full py-3.5 rounded-xl bg-nexscout-blue text-white font-semibold text-base shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_24px_rgba(37,99,235,0.4)] transition-all"
          >
            {isFacebookConnected ? 'Continue' : 'Finish'}
          </button>
          {!isFacebookConnected && (
            <p className="text-xs text-center text-gray-500 px-4">
              Facebook connection is required to analyze your network and find warm leads
            </p>
          )}
          <button
            onClick={onBack}
            className="w-full py-3 text-gray-500 font-medium text-base hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
