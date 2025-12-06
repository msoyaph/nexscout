import { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  Share2,
  FileText,
  User,
  Download,
  Copy,
  CheckCircle,
} from 'lucide-react';
import type { AIReadinessScore } from '../../services/company/aiReadinessService';

interface CompanySuccessProps {
  userId: string;
  userName: string;
  userTier: string;
  coinsEarned: number;
  aiReadiness: AIReadinessScore;
  onGenerateDeck: () => void;
  onViewProfile: () => void;
}

export default function CompanySuccess({
  userId,
  userName,
  userTier,
  coinsEarned,
  aiReadiness,
  onGenerateDeck,
  onViewProfile,
}: CompanySuccessProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/profile/${userId}`);
    setTimeout(() => setShowConfetti(false), 5000);
  }, [userId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${userName} - AI-Powered Sales Professional`,
        text: 'Check out my AI-powered sales profile on NexScout!',
        url: shareUrl,
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareBonus = userTier === 'pro' ? 100 : 20;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              {['🎉', '⭐', '💰', '🚀', '✨'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl animate-bounce">
            <Trophy className="size-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Setup Complete!</h1>
          <p className="text-2xl text-slate-600">Your Company AI is now READY</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="size-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">AI Brain Level</p>
                <p className="text-4xl font-bold text-slate-900">{aiReadiness.level}/10</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Readiness Grade</span>
                <span
                  className={`px-4 py-2 rounded-xl text-white font-bold text-lg bg-gradient-to-r ${
                    aiReadiness.grade === 'A+'
                      ? 'from-purple-600 to-pink-600'
                      : aiReadiness.grade === 'A'
                        ? 'from-green-600 to-emerald-600'
                        : 'from-blue-600 to-cyan-600'
                  }`}
                >
                  {aiReadiness.grade}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${aiReadiness.percentage}%` }}
                />
              </div>
              <p className="text-sm text-slate-600">{aiReadiness.percentage}% Complete</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
              <div>
                <p className="text-yellow-100 text-sm">Total Coins Earned</p>
                <p className="text-4xl font-bold">+{coinsEarned}</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-sm font-medium mb-2">What you completed:</p>
              <ul className="space-y-1 text-sm">
                {aiReadiness.completedItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="size-4" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What's Next?</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={onGenerateDeck}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <FileText className="size-6" />
              <span>Generate My First Pitch Deck</span>
            </button>

            <button
              onClick={onViewProfile}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <User className="size-6" />
              <span>View My About Me Page</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border-2 border-green-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Share2 className="size-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Share & Earn +{shareBonus} Bonus Coins!
              </h3>
              <p className="text-slate-700 mb-4">
                Share your AI-powered landing page and get {shareBonus} bonus coins when someone
                views it. Your profile showcases your company and builds credibility!
              </p>

              <div className="bg-white rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-lg">{userName}</p>
                    <p className="text-sm text-slate-600">AI-Powered Sales Professional</p>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-xl p-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-slate-600 outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="size-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleShare}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="size-5" />
                  Share Link
                </button>
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2">
                  <Download className="size-5" />
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 5s linear infinite;
          font-size: 2rem;
        }
      `}</style>
    </div>
  );
}
