import { Battery, BatteryCharging, Zap } from 'lucide-react';
import { useEnergy } from '../contexts/EnergyContext';

interface EnergyBarProps {
  onEnergyClick?: () => void;
  compact?: boolean;
}

export default function EnergyBar({ onEnergyClick, compact = false }: EnergyBarProps) {
  const { currentEnergy, maxEnergy, loading } = useEnergy();

  const getEnergyColor = () => {
    const percentage = (currentEnergy / maxEnergy) * 100;
    if (percentage <= 20) return 'text-red-600';
    if (percentage <= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getEnergyBgColor = () => {
    const percentage = (currentEnergy / maxEnergy) * 100;
    if (percentage <= 20) return 'bg-red-100';
    if (percentage <= 50) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const getBatteryIcon = () => {
    const percentage = (currentEnergy / maxEnergy) * 100;
    if (percentage <= 20) return Battery;
    return BatteryCharging;
  };

  const BatteryIcon = getBatteryIcon();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={onEnergyClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 ${getEnergyBgColor()} rounded-full hover:shadow-md transition-all`}
      >
        <BatteryIcon className={`w-4 h-4 ${getEnergyColor()}`} />
        <span className={`text-sm font-bold ${getEnergyColor()}`}>
          {currentEnergy}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onEnergyClick}
      className={`flex items-center gap-2 px-4 py-2 ${getEnergyBgColor()} rounded-full hover:shadow-lg transition-all`}
    >
      <BatteryIcon className={`w-5 h-5 ${getEnergyColor()}`} />
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold ${getEnergyColor()}`}>
            {currentEnergy} / {maxEnergy}
          </span>
          <Zap className={`w-3 h-3 ${getEnergyColor()}`} />
        </div>
        <span className="text-xs text-gray-600">Energy</span>
      </div>
    </button>
  );
}
