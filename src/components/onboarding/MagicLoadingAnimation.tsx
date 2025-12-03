/**
 * Magic Loading Animation
 *
 * Shows progress while auto-populating user data
 * Creates anticipation and excitement
 */

import { useEffect, useState } from 'react';
import { Sparkles, Building2, Package, Bot, Zap, CheckCircle } from 'lucide-react';

interface MagicLoadingAnimationProps {
  companyName: string;
  productsCount?: number;
  onComplete?: () => void;
}

const steps = [
  { icon: Building2, label: 'Setting up your company profile', duration: 1500 },
  { icon: Package, label: 'Loading your products', duration: 1500 },
  { icon: Bot, label: 'Configuring your AI chatbot', duration: 1200 },
  { icon: Zap, label: 'Building your CRM pipeline', duration: 1000 },
  { icon: Sparkles, label: 'Generating your sales scripts', duration: 1000 },
  { icon: CheckCircle, label: 'Preparing your first missions', duration: 800 },
];

export default function MagicLoadingAnimation({
  companyName,
  productsCount = 0,
  onComplete,
}: MagicLoadingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    // Step progression
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);

        if (currentStep === steps.length - 1) {
          // Last step completed
          setTimeout(() => {
            onComplete?.();
          }, 1000);
        }
      }, steps[currentStep].duration);

      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-6 animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Setting up your account...</h1>
            <p className="text-lg text-gray-600">
              We're auto-configuring everything for{' '}
              <span className="font-semibold text-blue-600">{companyName}</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Progress</span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 scale-105'
                      : isCompleted
                      ? 'bg-green-50 border-2 border-green-200'
                      : 'bg-gray-50 border-2 border-gray-200 opacity-50'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse'
                        : isCompleted
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        isActive
                          ? 'text-blue-900'
                          : isCompleted
                          ? 'text-green-900'
                          : 'text-gray-600'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {isActive && (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats Preview */}
          {productsCount > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{productsCount}</div>
                  <div className="text-sm text-gray-600">Products Ready</div>
                </div>
                <div className="w-px h-12 bg-gray-300" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">1</div>
                  <div className="text-sm text-gray-600">AI Chatbot</div>
                </div>
                <div className="w-px h-12 bg-gray-300" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">5</div>
                  <div className="text-sm text-gray-600">Sales Scripts</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Message */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ✨ This usually takes less than 90 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
