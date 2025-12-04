/**
 * Aha Moment Celebration
 *
 * Celebrates user achievements with confetti, animations, and rewards
 * Triggered when users hit key milestones
 */

import { useEffect, useState } from 'react';
import { X, Sparkles, Zap, Award, TrendingUp, CheckCircle } from 'lucide-react';
import { markCelebrationShown } from '../../services/onboarding/ahaMomentEngine';

interface AhaMomentCelebrationProps {
  userId: string;
  momentId: string;
  momentName: string;
  description: string;
  celebrationType: string;
  xpAwarded: number;
  energyAwarded: number;
  onClose: () => void;
}

export default function AhaMomentCelebration({
  userId,
  momentId,
  momentName,
  description,
  celebrationType,
  xpAwarded,
  energyAwarded,
  onClose,
}: AhaMomentCelebrationProps) {
  const [confettiPieces, setConfettiPieces] = useState<any[]>([]);

  useEffect(() => {
    // Generate confetti pieces
    if (celebrationType === 'confetti' || celebrationType === 'confetti_major') {
      const pieces = [];
      const count = celebrationType === 'confetti_major' ? 100 : 50;

      for (let i = 0; i < count; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          rotation: Math.random() * 360,
          color: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][Math.floor(Math.random() * 5)],
        });
      }

      setConfettiPieces(pieces);
    }

    // Mark as shown
    markCelebrationShown(userId, momentId);

    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        {/* Confetti */}
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute top-0 w-2 h-2 animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
            }}
          />
        ))}

        {/* Modal */}
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                {celebrationType === 'confetti_major' ? (
                  <Award className="w-12 h-12 text-white" />
                ) : celebrationType === 'timeline' ? (
                  <TrendingUp className="w-12 h-12 text-white" />
                ) : celebrationType === 'morning_surprise' ? (
                  <Sparkles className="w-12 h-12 text-white" />
                ) : (
                  <CheckCircle className="w-12 h-12 text-white" />
                )}
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              🎉 {momentName}
            </h2>
            <p className="text-lg text-gray-600">{description}</p>
          </div>

          {/* Rewards */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {xpAwarded > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                <Zap className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">+{xpAwarded}</div>
                  <div className="text-xs text-blue-700 font-semibold">XP</div>
                </div>
              </div>
            )}
            {energyAwarded > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-xl border-2 border-purple-200">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">+{energyAwarded}</div>
                  <div className="text-xs text-purple-700 font-semibold">Energy</div>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 mb-6">
            <p className="text-sm text-green-900 font-semibold text-center">
              ✨ You're on your way to sales success! Keep going!
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Confetti Animation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}} />
    </>
  );
}
