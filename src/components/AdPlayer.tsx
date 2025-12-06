import { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';

interface AdPlayerProps {
  onComplete: () => void;
  onClose: () => void;
  reward: {
    energy?: number;
    coins?: number;
  };
}

/**
 * Ad Player Component
 * 
 * Integrates with ad networks (Google AdMob, AdSense, or custom)
 * Shows 15-30 second video ads
 * Awards energy/coins on completion
 * 
 * TODO: Integrate with actual ad network
 * - Google AdMob for mobile
 * - Google AdSense for web
 * - Or custom ad server
 */
export default function AdPlayer({ onComplete, onClose, reward }: AdPlayerProps) {
  const [timeLeft, setTimeLeft] = useState(30); // 30 second ad
  const [isPlaying, setIsPlaying] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAdComplete();
          return 0;
        }
        
        // Allow skip after 5 seconds
        if (prev === 25) {
          setCanSkip(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleAdComplete = () => {
    onComplete();
  };

  const handleStart = () => {
    setIsPlaying(true);
  };

  const handleSkip = () => {
    if (canSkip && timeLeft <= 0) {
      handleAdComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white p-2"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Ad Container */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
          {!isPlaying ? (
            // Ad Preview
            <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center p-8 text-white">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6">
                <Play className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Watch Ad to Continue</h3>
              <p className="text-white/80 text-center mb-6">
                Watch a 30-second ad and get rewarded!
              </p>
              
              <div className="flex gap-4 mb-6">
                {reward.energy && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                    <span className="text-2xl">⚡</span>
                    <span className="font-bold">+{reward.energy} Energy</span>
                  </div>
                )}
                {reward.coins && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                    <span className="text-2xl">🪙</span>
                    <span className="font-bold">+{reward.coins} Coins</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleStart}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors"
              >
                Start Ad
              </button>
            </div>
          ) : (
            // Ad Playing
            <div className="aspect-video bg-black relative">
              {/* TODO: Replace with actual ad integration */}
              {/* For now, simulated ad */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold mb-2">{timeLeft}</div>
                  <div className="text-white/60">seconds remaining</div>
                </div>
                
                {/* Simulated Ad Content */}
                <div className="max-w-md text-center">
                  <div className="text-xl font-bold mb-4">Advertisement</div>
                  <div className="text-sm text-white/80">
                    This is where the actual ad video would play.
                    Integrate with Google AdMob, AdSense, or custom ad server.
                  </div>
                </div>
              </div>

              {/* Ad Controls */}
              <div className="absolute top-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold">
                  Ad {30 - timeLeft}/30
                </div>
              </div>

              {/* Skip Button (after 5 seconds) */}
              {canSkip && timeLeft === 0 && (
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Continue →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ad Network Credit */}
        <div className="mt-4 text-center">
          <p className="text-xs text-white/60">
            Ad powered by Google AdSense
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * INTEGRATION NOTES:
 * 
 * For Production:
 * 1. Sign up for Google AdMob (mobile) or AdSense (web)
 * 2. Get ad unit ID
 * 3. Install SDK: npm install @react-native-google-mobile-ads/admob (mobile)
 *    or use AdSense script tag (web)
 * 4. Replace simulated ad with actual ad component:
 * 
 * Example (AdMob for web):
 * <ins className="adsbygoogle"
 *      style={{ display: 'block' }}
 *      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
 *      data-ad-slot="XXXXXXXXXX"
 *      data-ad-format="auto"
 *      data-full-width-responsive="true">
 * </ins>
 * 
 * Example (Custom ad server):
 * <video
 *   src={adVideoUrl}
 *   autoPlay
 *   onEnded={handleAdComplete}
 *   className="w-full h-full object-cover"
 * />
 * 
 * 5. Track ad completion and award rewards via database
 * 6. Implement fraud detection (prevent auto-clickers)
 * 7. Set daily limits in database (5 ads/day)
 */




