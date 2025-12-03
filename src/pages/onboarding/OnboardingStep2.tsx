import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

interface OnboardingStep2Props {
  onNext: (goals: string[]) => void;
  onBack: () => void;
}

const availableGoals = [
  'Find warm leads',
  'Prioritize my day',
  'Generate pitch decks',
  'Help my team close',
  'Automate follow-ups',
  'Track my pipeline',
  'Improve conversions',
  'Build my network',
];

export default function OnboardingStep2({ onNext, onBack }: OnboardingStep2Props) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Prioritize my day',
    'Generate pitch decks',
  ]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 flex flex-col">
      <div className="px-6 py-8 flex-1 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Step 2 of 3</span>
            <span className="text-sm font-medium text-nexscout-blue">67%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-nexscout-blue rounded-full transition-all duration-500" />
          </div>
        </div>

        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          What are your goals?
        </h1>

        <div className="flex-1 mb-6">
          <div className="flex flex-wrap gap-3">
            {availableGoals.map((goal) => {
              const isSelected = selectedGoals.includes(goal);

              return (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`px-6 py-3 rounded-full font-medium text-sm transition-all ${
                    isSelected
                      ? 'bg-nexscout-blue text-white shadow-md'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {goal}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onNext(selectedGoals)}
            disabled={selectedGoals.length === 0}
            className="w-full py-3.5 rounded-xl bg-nexscout-blue text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 text-gray-500 font-medium text-base hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
