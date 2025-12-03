import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Zap, ArrowRight } from 'lucide-react';
import { estimateUpgradeROI } from '../services/dynamicNudgesV4';

interface ROICalculatorCardProps {
  userId: string;
  currentTier: string;
  targetTier: string;
  onUpgrade?: () => void;
}

export function ROICalculatorCard({ userId, currentTier, targetTier, onUpgrade }: ROICalculatorCardProps) {
  const [roiData, setRoiData] = useState<{
    monthlyRevenue: number;
    yearlyRevenue: number;
    paybackDays: number;
    multiplier: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadROI();
  }, [userId, targetTier]);

  const loadROI = async () => {
    setLoading(true);
    try {
      const estimate = await estimateUpgradeROI(userId, targetTier);

      const monthlyRevenue = estimate;
      const yearlyRevenue = estimate * 12;

      const tierPrices: Record<string, number> = {
        PRO: 499,
        TEAM: 999,
        ENTERPRISE: 2999,
      };

      const investmentCost = tierPrices[targetTier] || 499;
      const paybackDays = Math.ceil((investmentCost / monthlyRevenue) * 30);
      const multiplier = Math.round(monthlyRevenue / investmentCost * 10) / 10;

      setRoiData({
        monthlyRevenue,
        yearlyRevenue,
        paybackDays,
        multiplier,
      });
    } catch (error) {
      console.error('Error loading ROI:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-200 rounded w-2/3 mb-4" />
          <div className="h-4 bg-blue-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-blue-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!roiData) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Predicted ROI</h3>
          <p className="text-sm text-gray-600">Based on your activity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Monthly Revenue</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            ₱{roiData.monthlyRevenue.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Yearly Revenue</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            ₱{roiData.yearlyRevenue.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-600">Payback Period</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {roiData.paybackDays} days
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">ROI Multiplier</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {roiData.multiplier}x
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 text-white mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Investment</span>
          <span className="text-sm font-medium">Return (1 year)</span>
        </div>
        <div className="flex items-center justify-between text-2xl font-bold">
          <span>₱{targetTier === 'PRO' ? '499' : targetTier === 'TEAM' ? '999' : '2,999'}</span>
          <ArrowRight className="w-6 h-6" />
          <span>₱{roiData.yearlyRevenue.toLocaleString()}</span>
        </div>
      </div>

      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-md"
        >
          Unlock This ROI - Upgrade Now
        </button>
      )}

      <p className="text-xs text-gray-600 text-center mt-3">
        Calculations based on your current activity and industry averages
      </p>
    </div>
  );
}
