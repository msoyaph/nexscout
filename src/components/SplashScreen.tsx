import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const subtitleTimer = setTimeout(() => {
      setShowSubtitle(true);
    }, 500);

    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2850);

    return () => {
      clearTimeout(subtitleTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-white flex flex-col items-center justify-center z-50 ${
        fadeOut ? 'animate-fade-out' : ''
      }`}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 bg-nexscout-blue rounded-full blur-3xl animate-glow-pulse" />
          </div>

          <div className="relative z-10 animate-fade-in-scale">
            <div className="animate-float">
              <div className="w-32 h-32 bg-gradient-to-br from-nexscout-blue to-blue-600 rounded-[28px] shadow-soft-lg flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight animate-fade-in-scale">
            NexScout<span className="text-nexscout-blue">.ai</span>
          </h1>

          {showSubtitle && (
            <p className="text-nexscout-gray text-base font-light tracking-wide animate-fade-in-up">
              AI Prospecting. Reinvented.
            </p>
          )}
        </div>
      </div>

      <div className="absolute bottom-12 text-center px-6">
        <p className="text-xs text-gray-400 font-light tracking-wide">
          Powered by NexScout Intelligence Engine
        </p>
      </div>
    </div>
  );
}
