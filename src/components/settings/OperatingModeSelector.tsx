import { useState, useEffect } from 'react';
import { Zap, User, GitMerge, Settings, Check } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { OperatingModeService } from '../../services/operatingModeService';
import { OperatingMode, OPERATING_MODE_DESCRIPTIONS } from '../../types/operatingMode';
import { useAuth } from '../../contexts/AuthContext';

export function OperatingModeSelector() {
  const { user, profile } = useUser();
  const { refreshProfile } = useAuth();
  const [selectedMode, setSelectedMode] = useState<OperatingMode>('hybrid');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (profile?.operating_mode) {
      setSelectedMode(profile.operating_mode);
    }
  }, [profile]);

  const handleModeChange = async (mode: OperatingMode) => {
    if (mode === selectedMode || isLoading) return;

    setIsLoading(true);
    const success = await OperatingModeService.updateMode(user.id, mode);

    if (success) {
      setSelectedMode(mode);
      setShowSuccess(true);
      await refreshProfile();
      setTimeout(() => setShowSuccess(false), 3000);
    }

    setIsLoading(false);
  };

  const getIcon = (mode: OperatingMode) => {
    switch (mode) {
      case 'autopilot':
        return Zap;
      case 'manual':
        return User;
      case 'hybrid':
        return GitMerge;
    }
  };

  const modes: OperatingMode[] = ['autopilot', 'manual', 'hybrid'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Operating Mode</h2>
          <p className="text-sm text-gray-600">Choose how NexScout assists you</p>
        </div>
      </div>

      {showSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">Operating mode updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const config = OPERATING_MODE_DESCRIPTIONS[mode];
          const Icon = getIcon(mode);
          const isSelected = selectedMode === mode;

          return (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              disabled={isLoading}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? config.color : 'text-gray-600'}`} />
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{config.title}</h3>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">{config.description}</p>

              <div className="space-y-1">
                {config.features.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className={`w-1 h-1 rounded-full mt-1.5 ${
                      isSelected ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Current Mode: {OPERATING_MODE_DESCRIPTIONS[selectedMode].title}</h4>
            <p className="text-sm text-gray-600">
              {selectedMode === 'autopilot' && 'AI is handling your entire sales pipeline automatically. You can monitor progress from the dashboard.'}
              {selectedMode === 'manual' && 'You have full control over every action. AI will provide suggestions and generate content for you.'}
              {selectedMode === 'hybrid' && 'AI handles routine tasks automatically while requiring your approval for important decisions like closing deals.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
