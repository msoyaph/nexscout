import { useEffect, useState } from 'react';

interface AIScanningPageProps {
  onComplete: () => void;
}

const scanningStages = [
  'Connecting to Facebook...',
  'Analyzing your network...',
  'Detecting engagement patterns...',
  'Identifying warm leads...',
  'Calculating engagement scores...',
  'Building your prospect list...',
  'Almost there...',
];

export default function AIScanningPage({ onComplete }: AIScanningPageProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 1;
      });
    }, 60);

    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= scanningStages.length - 1) {
          clearInterval(stageInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 850);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, [onComplete]);

  return (
    <div className="bg-gray-900 min-h-screen text-white relative overflow-hidden flex flex-col">
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-nexscout-blue/30 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-80 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-green-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg viewBox="0 0 400 800" className="w-full h-full">
          <circle r="2" cx="50" cy="100" fill="currentColor" className="text-nexscout-blue animate-pulse" />
          <circle r="2" cx="150" cy="200" fill="currentColor" className="text-green-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <circle r="2" cx="300" cy="150" fill="currentColor" className="text-nexscout-blue animate-pulse" style={{ animationDelay: '0.4s' }} />
          <circle r="2" cx="100" cy="300" fill="currentColor" className="text-green-500 animate-pulse" style={{ animationDelay: '0.6s' }} />
          <circle r="2" cx="250" cy="250" fill="currentColor" className="text-nexscout-blue animate-pulse" style={{ animationDelay: '0.8s' }} />
          <circle r="2" cx="350" cy="350" fill="currentColor" className="text-green-500 animate-pulse" style={{ animationDelay: '1s' }} />
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="mb-16">
          <h1 className="text-4xl font-bold text-center">
            <span className="text-nexscout-blue">Nex</span>
            <span className="text-green-500">Scout</span>
            <span className="text-gray-300 font-light">.ai</span>
          </h1>
        </div>

        <div className="relative w-80 h-80 mb-12">
          <svg viewBox="0 0 320 320" className="w-full h-full">
            <defs>
              <linearGradient id="radarGradient1" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#1877F2" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1877F2" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="radarGradient2" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              r="140"
              cx="160"
              cy="160"
              fill="none"
              stroke="#1877F2"
              opacity="0.1"
              strokeWidth="1"
            />
            <circle
              r="110"
              cx="160"
              cy="160"
              fill="none"
              stroke="#1877F2"
              opacity="0.15"
              strokeWidth="1"
            />
            <circle
              r="80"
              cx="160"
              cy="160"
              fill="none"
              stroke="#1877F2"
              opacity="0.2"
              strokeWidth="1"
            />
            <circle
              r="50"
              cx="160"
              cy="160"
              fill="none"
              stroke="#22C55E"
              opacity="0.3"
              strokeWidth="2"
            />

            <g className="animate-spin origin-center" style={{ transformOrigin: '160px 160px', animationDuration: '3s' }}>
              <circle
                r="60"
                cx="160"
                cy="160"
                fill="none"
                filter="url(#glow)"
                stroke="#1877F2"
                opacity="0.5"
                strokeWidth="2"
                strokeDasharray="8 8"
              />
            </g>

            <g className="animate-spin origin-center" style={{ transformOrigin: '160px 160px', animationDuration: '4s', animationDirection: 'reverse' }}>
              <circle
                r="60"
                cx="160"
                cy="160"
                fill="none"
                filter="url(#glow)"
                stroke="#22C55E"
                opacity="0.5"
                strokeWidth="2"
                strokeDasharray="12 12"
              />
            </g>

            <g className="animate-spin origin-center" style={{ transformOrigin: '160px 160px', animationDuration: '2s' }}>
              <line
                x1="160"
                x2="160"
                y1="160"
                y2="20"
                filter="url(#glow)"
                stroke="url(#radarGradient1)"
                opacity="0.6"
                strokeWidth="2"
              />
            </g>

            <circle r="8" cx="160" cy="160" fill="#22C55E" filter="url(#glow)" opacity="0.8" className="animate-pulse" />
            <circle r="4" cx="220" cy="120" fill="#1877F2" opacity="0.7" className="animate-ping" />
            <circle r="3" cx="100" cy="180" fill="#22C55E" opacity="0.6" className="animate-ping" style={{ animationDelay: '0.5s' }} />
            <circle r="3" cx="190" cy="200" fill="#1877F2" opacity="0.5" className="animate-ping" style={{ animationDelay: '1s' }} />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-white mb-4 text-center">
          {scanningStages[currentStage]}
        </h1>

        <div className="mb-6">
          <div className="text-6xl font-bold text-nexscout-blue text-center mb-4">
            {progress}%
          </div>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-nexscout-blue to-green-500 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] transition-all duration-300"
            />
          </div>
        </div>

        <p className="text-base text-gray-400 text-center animate-pulse mt-4">
          This may take a few moments...
        </p>
      </div>
    </div>
  );
}
