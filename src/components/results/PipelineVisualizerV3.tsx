import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface PipelineStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface PipelineVisualizerV3Props {
  currentStep: string;
  steps?: PipelineStep[];
}

export default function PipelineVisualizerV3({ currentStep, steps }: PipelineVisualizerV3Props) {
  const defaultSteps: PipelineStep[] = [
    { id: 'EXTRACTING_TEXT', label: 'Extracting text', status: 'pending' },
    { id: 'DETECTING_NAMES', label: 'Detecting names', status: 'pending' },
    { id: 'DETECTING_INTERESTS', label: 'Detecting interests', status: 'pending' },
    { id: 'DETECTING_SIGNALS', label: 'Detecting intent signals', status: 'pending' },
    { id: 'SCOUTSCORE_V5', label: 'Scoring prospects (ScoutScore V5)', status: 'pending' },
    { id: 'FINALIZING', label: 'Finalizing insights', status: 'pending' },
  ];

  const pipelineSteps = steps || defaultSteps;

  const getStepStatus = (stepId: string): 'pending' | 'active' | 'completed' => {
    const stepIndex = pipelineSteps.findIndex((s) => s.id === stepId);
    const currentIndex = pipelineSteps.findIndex((s) => s.id === currentStep);

    if (currentIndex === -1) return 'pending';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E4E6EB] p-6">
      <h3 className="text-lg font-bold text-[#050505] mb-4">AI Processing Pipeline</h3>

      <div className="space-y-3">
        {pipelineSteps.map((step, index) => {
          const status = getStepStatus(step.id);

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {status === 'completed' && (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                )}
                {status === 'active' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#1877F2] animate-spin" />
                  </div>
                )}
                {status === 'pending' && (
                  <div className="w-8 h-8 bg-[#F0F2F5] rounded-full flex items-center justify-center">
                    <Circle className="w-5 h-5 text-[#65676B]" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div
                  className={`text-sm font-semibold ${
                    status === 'completed'
                      ? 'text-green-700'
                      : status === 'active'
                      ? 'text-[#1877F2]'
                      : 'text-[#65676B]'
                  }`}
                >
                  {step.label}
                </div>
                {status === 'active' && (
                  <div className="mt-1 h-1 bg-[#F0F2F5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1877F2] rounded-full animate-pulse w-2/3" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
