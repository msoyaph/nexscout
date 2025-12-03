import React, { useState, useEffect } from 'react';
import { Settings, Users, GitBranch, Brain, Save, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { loadAiSettings, saveAiSettings } from '../../services/aiSettings.service';
import { AiSettings, RankSetting, defaultAiSettings } from '../../types/AiSettings';

type TabKey = 'ranks' | 'funnels' | 'aiBehavior';

const Tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'ranks', label: 'Ranks', icon: <Users className="w-4 h-4" /> },
  { key: 'funnels', label: 'Funnels', icon: <GitBranch className="w-4 h-4" /> },
  { key: 'aiBehavior', label: 'AI Behavior', icon: <Brain className="w-4 h-4" /> },
];

export const AdminControlPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('ranks');
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings on mount
  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setSettings(defaultAiSettings('unknown'));
        setLoading(false);
        return;
      }

      try {
        const data = await loadAiSettings(user.id);
        setSettings(data);
      } catch (err) {
        console.error('Error loading AI settings:', err);
        setSettings(defaultAiSettings(user.id));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  // Save settings
  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setSaveMessage(null);

    const result = await saveAiSettings(settings);

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to save settings' });
    }

    setSaving(false);

    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(null), 3000);
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                NexScout Admin Control Panel
              </h1>
              <p className="text-xs text-gray-400">
                Manage ranks, funnels, and AI engine behavior
              </p>
            </div>
          </div>
          <span className="text-[11px] text-gray-500">Internal tools</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Save message */}
        {saveMessage && (
          <div
            className={`px-4 py-2 rounded-lg text-xs ${
              saveMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b text-xs bg-white rounded-t-xl">
          {Tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'ranks' && (
          <RankManager
            ranks={settings.ranks}
            onChange={(newRanks) => setSettings({ ...settings, ranks: newRanks })}
            onSave={handleSave}
            saving={saving}
          />
        )}
        {activeTab === 'funnels' && (
          <FunnelEditor
            funnels={settings.funnels}
            onChange={(newFunnels) => setSettings({ ...settings, funnels: newFunnels })}
            onSave={handleSave}
            saving={saving}
          />
        )}
        {activeTab === 'aiBehavior' && (
          <AiBehaviorSettings
            behavior={settings.aiBehavior}
            onChange={(newBehavior) => setSettings({ ...settings, aiBehavior: newBehavior })}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </main>
    </div>
  );
};

/* ------------- Rank Manager ------------- */

interface RankManagerProps {
  ranks: RankSetting[];
  onChange: (ranks: RankSetting[]) => void;
  onSave: () => void;
  saving: boolean;
}

const RankManager: React.FC<RankManagerProps> = ({ ranks, onChange, onSave, saving }) => {
  const updateRank = (idx: number, field: 'name' | 'minVolume', value: string) => {
    const next = [...ranks];
    if (field === 'minVolume') {
      next[idx] = { ...next[idx], minVolume: Number(value) };
    } else {
      next[idx] = { ...next[idx], name: value };
    }
    onChange(next);
  };

  const addRank = () => {
    onChange([...ranks, { name: '', minVolume: 0 }]);
  };

  const removeRank = (idx: number) => {
    onChange(ranks.filter((_, i) => i !== idx));
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Rank Manager</h2>
        <button
          onClick={addRank}
          className="text-xs text-blue-600 hover:underline"
        >
          + Add rank
        </button>
      </div>
      <p className="text-[11px] text-gray-500">
        Define rank names and minimum team volume. AI engines and funnel logic use these
        values to personalize coaching and sequences.
      </p>
      <div className="flex flex-col gap-2 text-xs">
        {ranks.map((r, idx) => (
          <div
            key={`${r.name}-${idx}`}
            className="grid grid-cols-3 gap-2 items-center"
          >
            <div>
              <label className="text-[11px] text-gray-500">Rank Name</label>
              <input
                className="border rounded-lg px-2 py-1 w-full"
                value={r.name}
                onChange={(e) => updateRank(idx, 'name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500">Min Volume</label>
              <input
                className="border rounded-lg px-2 py-1 w-full"
                type="number"
                value={r.minVolume}
                onChange={(e) => updateRank(idx, 'minVolume', e.target.value)}
              />
            </div>
            <div className="flex items-end justify-end">
              <button
                onClick={() => removeRank(idx)}
                className="text-[11px] text-gray-400 hover:text-red-500"
                disabled={ranks.length <= 1}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 text-xs bg-blue-600 text-white rounded-lg px-4 py-1.5 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saving ? 'Saving...' : 'Save ranks'}
        </button>
      </div>
    </section>
  );
};

/* ------------- Funnel Editor ------------- */

import { FunnelStages } from '../../types/AiSettings';

interface FunnelEditorProps {
  funnels: FunnelStages;
  onChange: (funnels: FunnelStages) => void;
  onSave: () => void;
  saving: boolean;
}

const FunnelEditor: React.FC<FunnelEditorProps> = ({ funnels, onChange, onSave, saving }) => {
  const funnelNames = Object.keys(funnels);
  const [selectedFunnel, setSelectedFunnel] = useState(funnelNames[0] || 'recruiting');

  const currentFunnel = funnels[selectedFunnel];
  const stages = currentFunnel?.stages || [];
  const labels = currentFunnel?.labels || {};

  const updateStageLabel = (stage: string, newLabel: string) => {
    const updatedFunnel = {
      ...currentFunnel,
      labels: {
        ...labels,
        [stage]: newLabel,
      },
    };

    onChange({
      ...funnels,
      [selectedFunnel]: updatedFunnel,
    });
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Funnel Editor</h2>
        <select
          className="text-xs border rounded-lg px-2 py-1"
          value={selectedFunnel}
          onChange={(e) => setSelectedFunnel(e.target.value)}
        >
          {funnelNames.map((name) => (
            <option key={name} value={name}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-gray-500">
        Define funnel stages and their labels. Sequence keys and AI flows use these
        stages to decide messaging.
      </p>
      <div className="flex flex-col gap-2 text-xs">
        {stages.map((stage, idx) => (
          <div
            key={stage}
            className="flex items-center justify-between border rounded-xl px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-400">System name: {stage}</span>
              <input
                className="border rounded-lg px-2 py-1 text-xs mt-1"
                value={labels[stage] || stage}
                onChange={(e) => updateStageLabel(stage, e.target.value)}
                placeholder={stage}
              />
            </div>
            <span className="text-[11px] text-gray-400">Order: {idx + 1}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 text-xs bg-blue-600 text-white rounded-lg px-4 py-1.5 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saving ? 'Saving...' : 'Save funnel'}
        </button>
      </div>
    </section>
  );
};

/* ------------- AI Behavior Settings ------------- */

import { AiBehaviorSetting } from '../../types/AiSettings';

interface AiBehaviorSettingsProps {
  behavior: AiBehaviorSetting;
  onChange: (behavior: AiBehaviorSetting) => void;
  onSave: () => void;
  saving: boolean;
}

const AiBehaviorSettings: React.FC<AiBehaviorSettingsProps> = ({ behavior, onChange, onSave, saving }) => {

  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-800">
        AI Behavior Settings
      </h2>
      <p className="text-[11px] text-gray-500">
        Control how NexScout AI behaves across funnels, ranks, and scenarios.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">
            Default voice for CLOSING stage
          </label>
          <select
            className="border rounded-lg px-2 py-1"
            value={behavior.defaultVoiceForClosing}
            onChange={(e) => onChange({ ...behavior, defaultVoiceForClosing: e.target.value })}
          >
            <option value="aggressiveCloser">Aggressive Closer</option>
            <option value="softNurturer">Soft Nurturer</option>
            <option value="professionalAdvisor">Professional Advisor</option>
            <option value="energeticCoach">Energetic Coach</option>
            <option value="empathicSupport">Empathic Support</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">
            Default voice for REVIVAL sequences
          </label>
          <select
            className="border rounded-lg px-2 py-1"
            value={behavior.defaultVoiceForRevival}
            onChange={(e) => onChange({ ...behavior, defaultVoiceForRevival: e.target.value })}
          >
            <option value="softNurturer">Soft Nurturer</option>
            <option value="aggressiveCloser">Aggressive Closer</option>
            <option value="professionalAdvisor">Professional Advisor</option>
            <option value="energeticCoach">Energetic Coach</option>
            <option value="empathicSupport">Empathic Support</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">
            Default voice for TRAINING / COACHING
          </label>
          <select
            className="border rounded-lg px-2 py-1"
            value={behavior.defaultVoiceForTraining}
            onChange={(e) => onChange({ ...behavior, defaultVoiceForTraining: e.target.value })}
          >
            <option value="professionalAdvisor">Professional Advisor</option>
            <option value="softNurturer">Soft Nurturer</option>
            <option value="aggressiveCloser">Aggressive Closer</option>
            <option value="energeticCoach">Energetic Coach</option>
            <option value="empathicSupport">Empathic Support</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={behavior.allowAutoFollowups}
              onChange={(e) => onChange({ ...behavior, allowAutoFollowups: e.target.checked })}
            />
            <span>Allow AI auto-follow-ups</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={behavior.useRankBasedCoaching}
              onChange={(e) => onChange({ ...behavior, useRankBasedCoaching: e.target.checked })}
            />
            <span>Use rank-based coaching logic</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 text-xs bg-blue-600 text-white rounded-lg px-4 py-1.5 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saving ? 'Saving...' : 'Save AI behavior'}
        </button>
      </div>
    </section>
  );
};

export default AdminControlPanel;
