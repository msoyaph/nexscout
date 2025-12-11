import { useState, useEffect, useRef } from 'react';
import { X, Play, Check, Star } from 'lucide-react';
import { adContentService, type AdContent } from '../services/ads/adContentService';

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
  const hasCompletedRef = useRef(false); // Use ref to prevent double calls (persists across renders)
  const [currentAd, setCurrentAd] = useState<AdContent | null>(null);

  // Load random ad on mount or when ad player opens
  useEffect(() => {
    if (!currentAd) {
      setCurrentAd(adContentService.getRandomAd());
    }
  }, [currentAd]);

  // Reset ad and completion state when opening player
  useEffect(() => {
    if (!isPlaying) {
      hasCompletedRef.current = false;
      setTimeLeft(30);
      setCanSkip(false);
      // Load new random ad each time
      setCurrentAd(adContentService.getRandomAd());
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || hasCompletedRef.current) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && !hasCompletedRef.current) {
          hasCompletedRef.current = true; // Mark as completed immediately
          clearInterval(interval);
          // Call onComplete once
          onComplete();
          return 0;
        }
        
        // Allow skip after 15 seconds (when timeLeft reaches 15)
        if (prev <= 15 && !canSkip) {
          setCanSkip(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, onComplete]);

  const handleAdComplete = () => {
    if (hasCompletedRef.current) return; // Guard against double calls
    hasCompletedRef.current = true;
    onComplete();
  };

  const handleStart = () => {
    setIsPlaying(true);
    hasCompletedRef.current = false; // Reset completion flag when starting new ad
  };

  const handleSkip = () => {
    if (canSkip && !hasCompletedRef.current) {
      handleAdComplete();
    }
  };

  const isAdComplete = timeLeft === 0 || hasCompletedRef.current;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-[90vw] h-[90vh] max-w-none">
        {/* Close Button - Only show when ad is complete */}
        {isAdComplete && (
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Ad Container */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl h-full w-full flex flex-col">
          {!isPlaying ? (
            // Ad Preview
            <div className={`flex-1 bg-gradient-to-br ${currentAd?.backgroundColor || 'from-blue-900 to-purple-900'} flex flex-col items-center justify-center p-8 ${currentAd?.textColor || 'text-white'}`}>
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6">
                <Play className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Watch Ad to Earn Coins</h3>
              <p className="text-white/80 text-center mb-6">
                Watch a 30-second ad about NexScout and get rewarded!
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
            // Ad Playing - Show actual ad content
            <div className="flex-1 bg-black relative overflow-hidden">
              {currentAd && (
                <div className={`absolute inset-0 bg-gradient-to-br ${currentAd.backgroundColor} ${currentAd.textColor} flex flex-col items-center justify-center p-8`}>
                  {/* Ad Content */}
                  <div className="max-w-2xl w-full text-center space-y-4">
                    {/* Ad Type Badge */}
                    <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-2">
                      {currentAd.title}
                    </div>

                    {/* Headline */}
                    <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                      {currentAd.headline}
                    </h2>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-white/90 mb-6">
                      {currentAd.subheadline}
                    </p>

                    {/* Features List (for features/chatbot/industries ads) */}
                    {currentAd.features && currentAd.features.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-w-xl mx-auto">
                        {currentAd.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-left bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <Check className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                            <span className="text-sm font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Testimonial (for testimonials ad) */}
                    {currentAd.testimonial && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 max-w-xl mx-auto">
                        <div className="flex items-center gap-1 mb-3 justify-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                          ))}
                        </div>
                        <p className="text-lg italic mb-4">"{currentAd.testimonial.quote}"</p>
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                            {currentAd.testimonial.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{currentAd.testimonial.name}</p>
                            <p className="text-sm text-white/70">{currentAd.testimonial.role}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/20">
                          <p className="text-sm font-semibold text-green-300">
                            ✓ {currentAd.testimonial.result}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* FOMO Elements (for fomo ad) */}
                    {currentAd.type === 'fomo' && (
                      <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-4 mb-6 max-w-xl mx-auto animate-pulse">
                        <p className="text-sm font-bold">⚡ Limited Time Offer - Ends Soon!</p>
                      </div>
                    )}

                    {/* CTA Button */}
                    <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl">
                      {currentAd.cta}
                    </button>

                    {/* App Name */}
                    <p className="text-sm text-white/60 mt-4">
                      Powered by <span className="font-semibold">NexScout</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Timer Overlay */}
              <div className="absolute top-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold">
                  {timeLeft}s
                </div>
              </div>

              {/* Skip Button (appears after 5 seconds) */}
              {canSkip && timeLeft > 0 && (
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 bg-white/90 text-gray-900 rounded-lg font-semibold hover:bg-white transition-colors shadow-lg"
                  >
                    Skip Ad ({timeLeft}s left)
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




