/**
 * MLM COMPENSATION PLAN BUILDER
 *
 * Visual editor for creating and managing MLM compensation plans
 * - Plan configuration (unilevel, binary, matrix)
 * - Level-by-level commission setup
 * - Rank requirements
 * - JSON export/import
 */

import React, { useState, useEffect } from 'react';
import { compensationPlanService } from '../services/compensationPlan.service';

type LevelConfig = { level: number; percentage: number };
type RankRule = { rank: string; minVolume: number };

interface CompensationPlan {
  planName: string;
  planType: 'unilevel' | 'binary' | 'matrix';
  maxLevels: number;
  levels: LevelConfig[];
  rankRules: RankRule[];
}

export const CompensationPlanBuilderPage: React.FC = () => {
  const [planName, setPlanName] = useState('Standard Unilevel');
  const [planType, setPlanType] = useState<'unilevel' | 'binary' | 'matrix'>('unilevel');
  const [levels, setLevels] = useState<LevelConfig[]>([
    { level: 1, percentage: 10 },
    { level: 2, percentage: 5 },
    { level: 3, percentage: 3 },
    { level: 4, percentage: 2 },
    { level: 5, percentage: 1 },
  ]);
  const [ranks, setRanks] = useState<RankRule[]>([
    { rank: 'Starter', minVolume: 0 },
    { rank: 'Silver', minVolume: 1000 },
    { rank: 'Gold', minVolume: 5000 },
    { rank: 'Platinum', minVolume: 15000 },
  ]);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load existing plan on mount
  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    setLoading(true);
    const result = await compensationPlanService.loadPlan(planName);

    if (result.success && result.plan) {
      setPlanName(result.plan.planName);
      setPlanType(result.plan.planType as any);
      setLevels(result.plan.levels);
      setRanks(result.plan.rankRules);
    }
    setLoading(false);
  };

  const addLevel = () => {
    const nextLevel = (levels[levels.length - 1]?.level || 0) + 1;
    setLevels([...levels, { level: nextLevel, percentage: 0 }]);
  };

  const updateLevel = (idx: number, field: keyof LevelConfig, value: string) => {
    const next = [...levels];
    (next[idx] as any)[field] = Number(value);
    setLevels(next);
  };

  const removeLevel = (idx: number) => {
    setLevels(levels.filter((_, i) => i !== idx));
  };

  const addRank = () => {
    setRanks([...ranks, { rank: '', minVolume: 0 }]);
  };

  const updateRank = (idx: number, field: keyof RankRule, value: string) => {
    const next = [...ranks];
    if (field === 'minVolume') {
      (next[idx] as any)[field] = Number(value);
    } else {
      (next[idx] as any)[field] = value;
    }
    setRanks(next);
  };

  const removeRank = (idx: number) => {
    setRanks(ranks.filter((_, i) => i !== idx));
  };

  const exportJson = () => {
    const config: CompensationPlan = {
      planName,
      planType,
      maxLevels: levels.length,
      levels,
      rankRules: ranks,
    };

    // Create download
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${planName.replace(/\s+/g, '_')}_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config: CompensationPlan = JSON.parse(event.target?.result as string);
          setPlanName(config.planName);
          setPlanType(config.planType);
          setLevels(config.levels);
          setRanks(config.rankRules);
          alert('Plan imported successfully!');
        } catch (error) {
          alert('Error importing plan. Please check the JSON format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const savePlan = async () => {
    setLoading(true);
    setSaveMessage('');

    const config = {
      planName,
      planType,
      maxLevels: levels.length,
      levels,
      rankRules: ranks,
    };

    const result = await compensationPlanService.savePlan(planName, planType, config);

    if (result.success) {
      setSaveMessage('Plan saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage(`Error: ${result.error}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">MLM Compensation Plan Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your network marketing compensation structure
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
          {/* Plan Settings */}
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Plan Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Plan Name</label>
                <input
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g., Standard Unilevel"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Plan Type</label>
                <select
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as any)}
                >
                  <option value="unilevel">Unilevel</option>
                  <option value="binary">Binary (coming soon)</option>
                  <option value="matrix">Matrix (coming soon)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Commission Levels */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Commission Levels</h2>
              <button
                onClick={addLevel}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                + Add Level
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {levels.map((lvl, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 items-center bg-gray-50 rounded-lg p-3"
                >
                  <div className="col-span-4 flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">Level</span>
                    <input
                      className="border rounded-lg px-3 py-2 text-sm"
                      type="number"
                      min="1"
                      value={lvl.level}
                      onChange={(e) => updateLevel(idx, 'level', e.target.value)}
                    />
                  </div>
                  <div className="col-span-6 flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">Commission %</span>
                    <input
                      className="border rounded-lg px-3 py-2 text-sm"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={lvl.percentage}
                      onChange={(e) => updateLevel(idx, 'percentage', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <button
                      onClick={() => removeLevel(idx)}
                      className="text-xs text-red-600 hover:underline w-full text-center py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Total commission payout: {levels.reduce((sum, l) => sum + l.percentage, 0)}%
            </div>
          </div>

          {/* Rank Requirements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Rank Requirements</h2>
              <button
                onClick={addRank}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                + Add Rank
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {ranks.map((r, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 items-center bg-gray-50 rounded-lg p-3"
                >
                  <div className="col-span-5 flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">Rank Name</span>
                    <input
                      className="border rounded-lg px-3 py-2 text-sm"
                      value={r.rank}
                      onChange={(e) => updateRank(idx, 'rank', e.target.value)}
                      placeholder="e.g., Silver"
                    />
                  </div>
                  <div className="col-span-5 flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">Min Volume (PHP)</span>
                    <input
                      className="border rounded-lg px-3 py-2 text-sm"
                      type="number"
                      min="0"
                      value={r.minVolume}
                      onChange={(e) => updateRank(idx, 'minVolume', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <button
                      onClick={() => removeRank(idx)}
                      className="text-xs text-red-600 hover:underline w-full text-center py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            {saveMessage && (
              <div className={`text-xs p-2 rounded-lg ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {saveMessage}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={importJson}
                  disabled={loading}
                  className="text-xs border rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Import JSON
                </button>
                <button
                  onClick={exportJson}
                  disabled={loading}
                  className="text-xs border rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Export JSON
                </button>
              </div>
              <button
                onClick={savePlan}
                disabled={loading}
                className="bg-indigo-600 text-white rounded-lg px-6 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Preview</h2>
          <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto">
            {JSON.stringify(
              {
                planName,
                planType,
                maxLevels: levels.length,
                levels,
                rankRules: ranks,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CompensationPlanBuilderPage;
