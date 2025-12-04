import { useState, useEffect } from 'react';
import { useUser } from '../../hooks/useUser';
import { loadWorkspaceConfig, saveWorkspaceConfig } from '../../services/workspaceConfig.service';
import { WorkspaceConfig } from '../../types/WorkspaceConfig';
import { Building2, Package, MessageSquare, Workflow, Brain, FileText, Presentation, Mail } from 'lucide-react';

type TabKey =
  | 'company'
  | 'products'
  | 'tone'
  | 'funnels'
  | 'aiBehavior'
  | 'customInstructions'
  | 'pitchDeck'
  | 'messages';

const Tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'tone', label: 'Tone & Persona', icon: MessageSquare },
  { key: 'funnels', label: 'Funnels', icon: Workflow },
  { key: 'aiBehavior', label: 'AI Behavior', icon: Brain },
  { key: 'customInstructions', label: 'Custom Instructions', icon: FileText },
  { key: 'pitchDeck', label: 'Pitch Deck', icon: Presentation },
  { key: 'messages', label: 'Messages', icon: Mail },
];

export default function AiAdminEditor() {
  const { user } = useUser();
  const [tab, setTab] = useState<TabKey>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<WorkspaceConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadConfig();
    }
  }, [user?.id]);

  const loadConfig = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const cfg = await loadWorkspaceConfig(user.id);
      setConfig(cfg);
    } catch (err) {
      console.error('Failed to load config:', err);
      setError('Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    setError(null);

    try {
      const result = await saveWorkspaceConfig(config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Failed to save config:', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading AI configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              AI Assistant Configuration
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Configure how your AI understands and represents your business
            </p>
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saving
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {Tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${
                    tab === t.key
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {tab === 'company' && (
              <CompanyEditor
                value={config.company}
                onChange={(company) => setConfig({ ...config, company })}
              />
            )}
            {tab === 'products' && (
              <ProductsEditor
                value={config.products}
                onChange={(products) => setConfig({ ...config, products })}
              />
            )}
            {tab === 'tone' && (
              <ToneEditor
                value={config.toneProfile}
                onChange={(toneProfile) => setConfig({ ...config, toneProfile })}
              />
            )}
            {tab === 'funnels' && (
              <FunnelsEditor
                value={config.funnels}
                onChange={(funnels) => setConfig({ ...config, funnels })}
              />
            )}
            {tab === 'aiBehavior' && (
              <AiBehaviorEditor
                value={config.aiBehavior}
                onChange={(aiBehavior) => setConfig({ ...config, aiBehavior })}
              />
            )}
            {tab === 'customInstructions' && (
              <CustomInstructionsEditor
                value={config.customInstructions}
                onChange={(customInstructions) =>
                  setConfig({ ...config, customInstructions })
                }
              />
            )}
            {tab === 'pitchDeck' && (
              <PitchDeckEditor
                value={config.aiPitchDeck}
                onChange={(aiPitchDeck) => setConfig({ ...config, aiPitchDeck })}
              />
            )}
            {tab === 'messages' && (
              <MessagesEditor
                value={config.aiMessages}
                onChange={(aiMessages) => setConfig({ ...config, aiMessages })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Company Editor
interface CompanyEditorProps {
  value: any;
  onChange: (v: any) => void;
}

function CompanyEditor({ value, onChange }: CompanyEditorProps) {
  const update = (field: string, val: any) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Company Profile</h2>
        <p className="text-sm text-gray-500">
          This is how the AI describes and represents your business
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value.name || ''}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value.brandName || ''}
            onChange={(e) => update('brandName', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value.industry || ''}
            onChange={(e) => update('industry', e.target.value)}
            placeholder="e.g., Health & Wellness, E-commerce"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value.website || ''}
            onChange={(e) => update('website', e.target.value)}
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Audience
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={value.audience || ''}
          onChange={(e) => update('audience', e.target.value)}
          placeholder="e.g., Health-conscious professionals, Small business owners"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Description
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
          value={value.description || ''}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Describe what your company does and what makes it unique..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mission Statement
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={value.mission || ''}
          onChange={(e) => update('mission', e.target.value)}
          placeholder="What is your company's mission?"
          rows={3}
        />
      </div>
    </div>
  );
}

// Products Editor
interface ProductsEditorProps {
  value: { products: any[] };
  onChange: (v: { products: any[] }) => void;
}

function ProductsEditor({ value, onChange }: ProductsEditorProps) {
  const products = value.products || [];

  const updateProduct = (idx: number, field: string, val: any) => {
    const next = [...products];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ products: next });
  };

  const addProduct = () => {
    onChange({
      products: [
        ...products,
        {
          id: `prod-${Date.now()}`,
          name: '',
          category: '',
          description: '',
          benefits: [],
          pricing: { amount: 0, currency: 'PHP' },
          active: true,
        },
      ],
    });
  };

  const removeProduct = (idx: number) => {
    const next = products.filter((_, i) => i !== idx);
    onChange({ products: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Products & Services</h2>
          <p className="text-sm text-gray-500">
            Add products so the AI can recommend and sell them
          </p>
        </div>
        <button
          onClick={addProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Add Product
        </button>
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No products yet. Add at least one product for the AI to sell.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {products.map((p, idx) => (
          <div
            key={p.id || idx}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-700">
                Product #{idx + 1}
              </span>
              <button
                onClick={() => removeProduct(idx)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={p.name || ''}
                  onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={p.category || ''}
                  onChange={(e) => updateProduct(idx, 'category', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={p.pricing?.amount || 0}
                  onChange={(e) =>
                    updateProduct(idx, 'pricing', {
                      ...p.pricing,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Currency
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={p.pricing?.currency || 'PHP'}
                  onChange={(e) =>
                    updateProduct(idx, 'pricing', {
                      ...p.pricing,
                      currency: e.target.value,
                    })
                  }
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={p.description || ''}
                onChange={(e) => updateProduct(idx, 'description', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tone Editor
interface ToneEditorProps {
  value: any;
  onChange: (v: any) => void;
}

function ToneEditor({ value, onChange }: ToneEditorProps) {
  const update = (field: string, val: any) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Tone & Persona</h2>
        <p className="text-sm text-gray-500">
          Control how your AI sounds when talking to prospects
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand Voice
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.brandVoice || 'warm'}
            onChange={(e) => update('brandVoice', e.target.value)}
          >
            <option value="warm">Warm & Friendly</option>
            <option value="corporate">Corporate & Professional</option>
            <option value="energetic">Energetic & Motivating</option>
            <option value="spiritual">Spiritual & Values-driven</option>
            <option value="professional">Professional & Balanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language Mix
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.languageMix || 'english'}
            onChange={(e) => update('languageMix', e.target.value)}
          >
            <option value="english">English</option>
            <option value="filipino">Filipino</option>
            <option value="taglish">Taglish (Mix)</option>
            <option value="cebuano">Cebuano/Bisaya</option>
            <option value="spanish">Spanish</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emoji Usage
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.emojiUsage || 'minimal'}
            onChange={(e) => update('emojiUsage', e.target.value)}
          >
            <option value="none">None</option>
            <option value="minimal">Minimal (1-2)</option>
            <option value="moderate">Moderate (3-4)</option>
            <option value="frequent">Frequent (5+)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Formality Level
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.formality || 'neutral'}
            onChange={(e) => update('formality', e.target.value)}
          >
            <option value="casual">Casual & Conversational</option>
            <option value="neutral">Neutral & Balanced</option>
            <option value="formal">Formal & Professional</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sentence Length
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.sentenceLength || 'medium'}
            onChange={(e) => update('sentenceLength', e.target.value)}
          >
            <option value="short">Short (max 15 words)</option>
            <option value="medium">Medium (balanced)</option>
            <option value="long">Long (detailed)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pacing
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.pacing || 'medium'}
            onChange={(e) => update('pacing', e.target.value)}
          >
            <option value="fast">Fast (quick responses)</option>
            <option value="medium">Medium (balanced)</option>
            <option value="slow">Slow (thoughtful)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Funnels Editor (simplified)
interface FunnelsEditorProps {
  value: any;
  onChange: (v: any) => void;
}

function FunnelsEditor({ value, onChange }: FunnelsEditorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Funnels & Sequences</h2>
        <p className="text-sm text-gray-500">
          Define your sales journey stages and automation rules
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Funnel management coming soon. Use the existing funnel system for now.
        </p>
      </div>
    </div>
  );
}

// AI Behavior Editor
interface AiBehaviorEditorProps {
  value: any;
  onChange: (v: any) => void;
}

function AiBehaviorEditor({ value, onChange }: AiBehaviorEditorProps) {
  const update = (field: string, val: any) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">AI Behavior Settings</h2>
        <p className="text-sm text-gray-500">
          Configure AI personality and automation preferences
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI Agent Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.agentName || ''}
            onChange={(e) => update('agentName', e.target.value)}
            placeholder="e.g., Maria, AI Assistant"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Voice for Closing
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.defaultVoiceForClosing || 'aggressiveCloser'}
            onChange={(e) => update('defaultVoiceForClosing', e.target.value)}
          >
            <option value="aggressiveCloser">Aggressive Closer</option>
            <option value="softNurturer">Soft Nurturer</option>
            <option value="professionalAdvisor">Professional Advisor</option>
            <option value="energeticCoach">Energetic Coach</option>
            <option value="empathicSupport">Empathic Support</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Voice for Revival
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.defaultVoiceForRevival || 'softNurturer'}
            onChange={(e) => update('defaultVoiceForRevival', e.target.value)}
          >
            <option value="aggressiveCloser">Aggressive Closer</option>
            <option value="softNurturer">Soft Nurturer</option>
            <option value="professionalAdvisor">Professional Advisor</option>
            <option value="energeticCoach">Energetic Coach</option>
            <option value="empathicSupport">Empathic Support</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Voice for Training
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={value.defaultVoiceForTraining || 'energeticCoach'}
            onChange={(e) => update('defaultVoiceForTraining', e.target.value)}
          >
            <option value="aggressiveCloser">Aggressive Closer</option>
            <option value="softNurturer">Soft Nurturer</option>
            <option value="professionalAdvisor">Professional Advisor</option>
            <option value="energeticCoach">Energetic Coach</option>
            <option value="empathicSupport">Empathic Support</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.behaviorFlags?.allowAutoFollowups || false}
            onChange={(e) =>
              update('behaviorFlags', {
                ...value.behaviorFlags,
                allowAutoFollowups: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Allow Auto Follow-ups</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.behaviorFlags?.useRankBasedCoaching || false}
            onChange={(e) =>
              update('behaviorFlags', {
                ...value.behaviorFlags,
                useRankBasedCoaching: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Use Rank-Based Coaching</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.behaviorFlags?.enableSmartRouting || false}
            onChange={(e) =>
              update('behaviorFlags', {
                ...value.behaviorFlags,
                enableSmartRouting: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Enable Smart Routing</span>
        </label>
      </div>
    </div>
  );
}

// Custom Instructions Editor
interface CustomInstructionsEditorProps {
  value: any;
  onChange: (v: any) => void;
}

function CustomInstructionsEditor({ value, onChange }: CustomInstructionsEditorProps) {
  const update = (field: string, val: any) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Custom Instructions</h2>
        <p className="text-sm text-gray-500">
          Special rules you want the AI to always follow (highest priority)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priority Level (1-10)
        </label>
        <input
          type="number"
          min="1"
          max="10"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={value.priority || 10}
          onChange={(e) => update('priority', parseInt(e.target.value) || 10)}
        />
        <p className="text-xs text-gray-500 mt-1">
          10 = Highest priority (overrides defaults)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Global Instructions
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[150px] font-mono text-sm"
          value={value.globalInstructions || ''}
          onChange={(e) => update('globalInstructions', e.target.value)}
          placeholder="Enter special instructions the AI must always follow...

Example:
- Always mention our 30-day money-back guarantee
- Never recommend competitor products
- Always ask for permission before scheduling calls"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Forbidden Words/Phrases (comma-separated)
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={value.forbiddenPhrases?.join(', ') || ''}
          onChange={(e) =>
            update(
              'forbiddenPhrases',
              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
            )
          }
          placeholder="e.g., guaranteed income, get rich quick, pyramid"
        />
      </div>
    </div>
  );
}

// Pitch Deck Editor (stub)
interface PitchDeckEditorProps {
  value: any;
  onChange: (v: any) => void;
}

function PitchDeckEditor({ value, onChange }: PitchDeckEditorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">AI Pitch Deck</h2>
        <p className="text-sm text-gray-500">
          Configure presentation slides for AI-generated pitch decks
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Presentation className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Pitch deck editor coming soon. Use the existing pitch deck system for now.
        </p>
      </div>
    </div>
  );
}

// Messages Editor (stub)
interface MessagesEditorProps {
  value: any;
  onChange: (v: any) => void;
}

function MessagesEditor({ value, onChange }: MessagesEditorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">AI Messages & Templates</h2>
        <p className="text-sm text-gray-500">
          Manage message templates and sequences
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Message template editor coming soon. Use the existing messaging system for now.
        </p>
      </div>
    </div>
  );
}
