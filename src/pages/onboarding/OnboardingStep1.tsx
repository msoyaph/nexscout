import { useState } from 'react';
import { Shield, Users, Home, MessageCircle, Grid3x3 } from 'lucide-react';

interface OnboardingStep1Props {
  onNext: (role: string) => void;
}

const roles = [
  {
    id: 'insurance',
    label: 'Insurance',
    icon: Shield,
  },
  {
    id: 'mlm',
    label: 'MLM/Network Marketing',
    icon: Users,
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    icon: Home,
  },
  {
    id: 'coaching',
    label: 'Coaching',
    icon: MessageCircle,
  },
  {
    id: 'other',
    label: 'Other',
    icon: Grid3x3,
  },
];

export default function OnboardingStep1({ onNext }: OnboardingStep1Props) {
  const [selectedRole, setSelectedRole] = useState<string>('insurance');

  return (
    <div className="bg-white min-h-screen text-gray-900 relative overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col px-6 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Step 1 of 3</span>
            <span className="text-sm font-medium text-nexscout-blue">33%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-nexscout-blue rounded-full transition-all duration-500" />
          </div>
        </div>

        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Select Your Role
        </h1>
        <p className="text-base text-gray-600 mb-8">
          Choose the industry that best describes your business
        </p>

        <div className="flex-1 space-y-4 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative w-full p-5 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-nexscout-blue shadow-md'
                    : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center size-12 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-nexscout-blue/10'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`size-6 ${
                        isSelected ? 'text-nexscout-blue' : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {role.label}
                    </h3>
                  </div>
                  {isSelected && (
                    <div className="flex items-center justify-center size-6 rounded-full bg-nexscout-blue">
                      <svg
                        className="size-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onNext(selectedRole)}
          className="w-full py-3.5 rounded-xl bg-nexscout-blue text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
