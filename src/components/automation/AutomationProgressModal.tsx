import { Check, Clock, Loader2, X } from 'lucide-react';

interface ProgressStep {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  duration?: number; // seconds
  description?: string;
}

interface AutomationProgressModalProps {
  isOpen: boolean;
  action: string;
  prospectName: string;
  steps: ProgressStep[];
  currentStep: number;
  estimatedTotal: number; // seconds
  onCancel?: () => void;
}

export default function AutomationProgressModal({
  isOpen,
  action,
  prospectName,
  steps,
  currentStep,
  estimatedTotal,
  onCancel,
}: AutomationProgressModalProps) {
  if (!isOpen) return null;

  const progress = (currentStep / steps.length) * 100;
  const timeElapsed = steps
    .filter(s => s.status === 'complete')
    .reduce((sum, s) => sum + (s.duration || 0), 0);
  const timeRemaining = Math.max(0, estimatedTotal - timeElapsed);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">{action} Running...</h2>
              <p className="text-blue-100 text-sm">For: {prospectName}</p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Time Display */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-blue-100">⏱️ {timeElapsed}s elapsed</span>
            <span className="font-semibold">~{timeRemaining}s remaining</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.status === 'complete' ? 'bg-green-500' :
                step.status === 'running' ? 'bg-blue-500' :
                step.status === 'failed' ? 'bg-red-500' :
                'bg-gray-300'
              }`}>
                {step.status === 'complete' ? (
                  <Check className="w-5 h-5 text-white" />
                ) : step.status === 'running' ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : step.status === 'failed' ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-600" />
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.status === 'complete' ? 'text-gray-900' :
                  step.status === 'running' ? 'text-blue-600' :
                  step.status === 'failed' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {step.name}
                </p>
                
                {step.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                )}
                
                {step.status === 'complete' && step.duration && (
                  <p className="text-xs text-green-600 mt-0.5">
                    ✓ Completed in {step.duration}s
                  </p>
                )}
                
                {step.status === 'running' && (
                  <p className="text-xs text-blue-600 mt-0.5 animate-pulse">
                    Processing...
                  </p>
                )}
                
                {step.status === 'failed' && (
                  <p className="text-xs text-red-600 mt-0.5">
                    Failed - retrying...
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="px-6 pb-6">
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel Automation
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Energy and coins will be refunded if cancelled
            </p>
          </div>
        )}
      </div>
    </div>
  );
}




