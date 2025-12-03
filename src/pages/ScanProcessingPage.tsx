import { useEffect, useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ScanProcessingPageProps {
  onNavigate: (page: string, options?: any) => void;
  sourceType?: string;
  files?: File[];
  textContent?: string;
  scanId?: string;
}

export default function ScanProcessingPage({
  onNavigate,
  sourceType = 'screenshots',
  files,
  textContent,
  scanId: providedScanId,
}: ScanProcessingPageProps) {
  const { user } = useAuth();
  const [scanId, setScanId] = useState<string | null>(providedScanId || null);
  const [progress, setProgress] = useState({ percent: 0, message: 'Initializing...', step: 'IDLE' });
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = sourceType === 'csv' || sourceType === 'paste'
    ? [
        { label: 'Reading data', threshold: 5 },
        { label: 'Extracting text', threshold: 20 },
        { label: 'Detecting names', threshold: 40 },
        { label: 'Analyzing content', threshold: 60 },
        { label: 'Scoring prospects', threshold: 80 },
        { label: 'Finalizing results', threshold: 95 },
      ]
    : [
        { label: 'Scraping webpage', threshold: 5 },
        { label: 'Extracting text', threshold: 15 },
        { label: 'Detecting names', threshold: 40 },
        { label: 'Analyzing content', threshold: 60 },
        { label: 'Scoring prospects', threshold: 80 },
        { label: 'Finalizing results', threshold: 95 },
      ];

  const startPolling = useCallback((id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        if (!token) return;

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-status-check?scanId=${id}`;
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProgress({
            percent: data.progress || 0,
            message: data.message || '',
            step: data.step || 'QUEUED',
          });

          if (data.status === 'completed' || data.step === 'completed' || data.step === 'COMPLETED' || data.progress >= 100) {
            clearInterval(pollInterval);
            console.log('Scan complete! Redirecting to results...', { scanId: id, status: data.status, step: data.step });
            setTimeout(() => {
              onNavigate('scan-results-3', { scanId: id });
            }, 1500);
          } else if (data.status === 'failed' || data.step === 'failed') {
            clearInterval(pollInterval);
            setError('Scan failed');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [onNavigate]);

  useEffect(() => {
    if (!providedScanId) return;

    setScanId(providedScanId);
    const cleanup = startPolling(providedScanId);

    return cleanup;
  }, [providedScanId, startPolling]);



  useEffect(() => {
    const percentage = progress.percent || 0;
    const step = steps.findIndex(s => percentage < s.threshold);
    setCurrentStep(step === -1 ? steps.length - 1 : step);
  }, [progress]);


  useEffect(() => {
    if (error) {
      setTimeout(() => {
        onNavigate('scan-entry');
      }, 3000);
    }
  }, [error, onNavigate]);

  const progressPercentage = progress.percent || 0;

  if (!providedScanId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">No Scan Found</h1>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {error ? 'Scan Failed' : 'Scanning Your Data...'}
          </h1>
          <p className="text-gray-600">
            {error
              ? 'Something went wrong. Redirecting...'
              : 'AI is analyzing your prospects'}
          </p>
        </div>

        {!error && (
          <>
            <div className="relative flex items-center justify-center py-16">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute size-64 rounded-full bg-blue-500/5 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute size-52 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                <div className="absolute size-40 rounded-full bg-cyan-500/15 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="absolute size-28 rounded-full bg-cyan-500/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
              </div>

              <div className="relative size-56 rounded-full border-4 border-blue-200 flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 rounded-full bg-[#1877F2] shadow-lg shadow-blue-500/50" />
                <div className="absolute size-48 rounded-full border-4 border-blue-300" />
                <div className="absolute size-40 rounded-full border-4 border-cyan-400" />
                <div className="absolute size-32 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="size-24 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-md flex items-center justify-center animate-pulse">
                    <svg className="size-12 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                </div>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute size-2 rounded-full bg-cyan-400 animate-pulse"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${i * 60}deg) translateY(-100px)`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{progress.message || steps[currentStep]?.label}</span>
                <span className="font-bold text-[#1877F2]">{progressPercentage}%</span>
              </div>

              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1877F2] via-[#1EC8FF] to-[#1877F2] rounded-full transition-all duration-500 animate-shimmer"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundSize: '200% 100%',
                  }}
                />
              </div>

              <div className="space-y-3 pt-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-all duration-300 ${
                      index <= currentStep ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    <div
                      className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        index < currentStep
                          ? 'bg-green-500 scale-100'
                          : index === currentStep
                          ? 'bg-[#1877F2] scale-110 animate-pulse'
                          : 'bg-gray-300 scale-90'
                      }`}
                    >
                      {index < currentStep ? (
                        <Check className="size-4 text-white" />
                      ) : (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}


        {error && (
          <div className="bg-red-50 rounded-3xl p-8 border-2 border-red-200 text-center">
            <div className="size-20 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
              <svg className="size-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scan Failed</h2>
            <p className="text-gray-700">{error}</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
