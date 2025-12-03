import { useState, useEffect } from 'react';
import { ArrowLeft, Bot, Settings, MessageSquare, Database, Link2, BarChart3, Plus, Save, Trash2, Power, Edit, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ChatbotControlPanelProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface ChatbotConfig {
  id: string;
  chatbot_name: string;
  personality: string;
  tone: string;
  response_length: string;
  language: string;
  welcome_message: string;
  use_company_data: boolean;
  use_prospect_data: boolean;
  auto_suggest_actions: boolean;
  enable_voice: boolean;
  max_context_messages: number;
}

interface TrainingData {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  is_active: boolean;
  source?: string;
  auto_synced?: boolean;
}

interface Integration {
  id: string;
  platform: string;
  integration_name: string;
  is_enabled: boolean;
  webhook_url?: string;
}

export default function AIChatbotControlPanel({ onBack, onNavigate }: ChatbotControlPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'training' | 'integrations' | 'analytics'>('settings');
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [newTraining, setNewTraining] = useState({
    category: 'faq',
    question: '',
    answer: '',
    tags: ''
  });
  const [companyDataStats, setCompanyDataStats] = useState({
    autoSynced: 0,
    manual: 0,
    total: 0
  });
  const [syncing, setSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    category: '',
    question: '',
    answer: '',
    tags: ''
  });

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadConfig(),
      loadTrainingData(),
      loadIntegrations()
    ]);
    setLoading(false);
  };

  const loadConfig = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chatbot_configurations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading config:', error);
      return;
    }

    if (!data) {
      // Create default config
      const { data: newConfig } = await supabase
        .from('chatbot_configurations')
        .insert({ user_id: user.id })
        .select()
        .single();

      setConfig(newConfig);
    } else {
      setConfig(data);
    }
  };

  const loadTrainingData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('chatbot_training_data')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setTrainingData(data || []);

    const autoSynced = (data || []).filter(item => item.auto_synced).length;
    const manual = (data || []).filter(item => !item.auto_synced).length;
    setCompanyDataStats({
      autoSynced,
      manual,
      total: (data || []).length
    });
  };

  const manualSyncCompanyData = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      const { data: companyProfiles } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id);

      if (companyProfiles && companyProfiles.length > 0) {
        for (const profile of companyProfiles) {
          await supabase.rpc('sync_company_to_chatbot_training', {
            p_user_id: user.id,
            p_company_id: profile.id
          });
        }
      }

      const { data: intelligence } = await supabase
        .from('company_intelligence_v2')
        .select('id')
        .eq('user_id', user.id);

      if (intelligence && intelligence.length > 0) {
        for (const intel of intelligence) {
          await supabase.rpc('sync_company_intelligence_to_chatbot', {
            p_user_id: user.id,
            p_intelligence_id: intel.id
          });
        }
      }

      await loadTrainingData();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setSyncing(false);
    }
  };

  const loadIntegrations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('chatbot_integrations')
      .select('*')
      .eq('user_id', user.id);

    setIntegrations(data || []);
  };

  const saveConfig = async () => {
    if (!user || !config) return;

    setSaving(true);
    const { error } = await supabase
      .from('chatbot_configurations')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('id', config.id);

    if (error) {
      console.error('Error saving config:', error);
    }
    setSaving(false);
  };

  const addTrainingData = async () => {
    if (!user || !newTraining.question || !newTraining.answer) return;

    const { error } = await supabase
      .from('chatbot_training_data')
      .insert({
        user_id: user.id,
        category: newTraining.category,
        question: newTraining.question,
        answer: newTraining.answer,
        tags: newTraining.tags.split(',').map(t => t.trim()).filter(Boolean)
      });

    if (!error) {
      setNewTraining({ category: 'faq', question: '', answer: '', tags: '' });
      setShowAddTraining(false);
      loadTrainingData();
    }
  };

  const deleteTrainingData = async (id: string) => {
    await supabase
      .from('chatbot_training_data')
      .delete()
      .eq('id', id);

    loadTrainingData();
  };

  const toggleTrainingActive = async (id: string, isActive: boolean) => {
    await supabase
      .from('chatbot_training_data')
      .update({ is_active: !isActive })
      .eq('id', id);

    loadTrainingData();
  };

  const startEdit = (item: TrainingData) => {
    setEditingId(item.id);
    setEditData({
      category: item.category,
      question: item.question,
      answer: item.answer,
      tags: item.tags.join(', ')
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({
      category: '',
      question: '',
      answer: '',
      tags: ''
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    await supabase
      .from('chatbot_training_data')
      .update({
        category: editData.category,
        question: editData.question,
        answer: editData.answer,
        tags: editData.tags.split(',').map(t => t.trim()).filter(Boolean),
        updated_at: new Date().toISOString()
      })
      .eq('id', editingId);

    setEditingId(null);
    setEditData({ category: '', question: '', answer: '', tags: '' });
    loadTrainingData();
  };

  const toggleIntegration = async (id: string, isEnabled: boolean) => {
    await supabase
      .from('chatbot_integrations')
      .update({ is_enabled: !isEnabled })
      .eq('id', id);

    loadIntegrations();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Chatbot Control Panel</h1>
                <p className="text-xs text-gray-500">Configure your AI assistant</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('ai-chatbot')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Test Chatbot
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'training'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Training Data
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'integrations'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* Settings Tab */}
        {activeTab === 'settings' && config && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chatbot Name
                  </label>
                  <input
                    type="text"
                    value={config.chatbot_name}
                    onChange={(e) => setConfig({ ...config, chatbot_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={config.welcome_message}
                    onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Personality */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Personality & Tone</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personality
                  </label>
                  <select
                    value={config.personality}
                    onChange={(e) => setConfig({ ...config, personality: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="expert">Expert</option>
                    <option value="motivational">Motivational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={config.tone}
                    onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="helpful">Helpful</option>
                    <option value="direct">Direct</option>
                    <option value="empathetic">Empathetic</option>
                    <option value="energetic">Energetic</option>
                    <option value="calm">Calm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Length
                  </label>
                  <select
                    value={config.response_length}
                    onChange={(e) => setConfig({ ...config, response_length: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="concise">Concise</option>
                    <option value="medium">Medium</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => setConfig({ ...config, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="taglish">Taglish</option>
                    <option value="fil">Filipino</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Features</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Use Company Data</div>
                    <div className="text-sm text-gray-600">Let chatbot access company information</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.use_company_data}
                    onChange={(e) => setConfig({ ...config, use_company_data: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Use Prospect Data</div>
                    <div className="text-sm text-gray-600">Let chatbot access prospect insights</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.use_prospect_data}
                    onChange={(e) => setConfig({ ...config, use_prospect_data: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Auto-Suggest Actions</div>
                    <div className="text-sm text-gray-600">Suggest follow-up actions automatically</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.auto_suggest_actions}
                    onChange={(e) => setConfig({ ...config, auto_suggest_actions: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Voice Input</div>
                    <div className="text-sm text-gray-600">Enable voice-to-text feature</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enable_voice}
                    onChange={(e) => setConfig({ ...config, enable_voice: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Training Data Tab */}
        {activeTab === 'training' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Training Data</h2>
              <button
                onClick={() => setShowAddTraining(!showAddTraining)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Training Data
              </button>
            </div>

            {/* Company Data Integration Status */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Company Intelligence Integration</h3>
                    <p className="text-sm text-gray-600">Auto-synced training data from your company profile</p>
                  </div>
                </div>
                <button
                  onClick={manualSyncCompanyData}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{companyDataStats.autoSynced}</p>
                  <p className="text-xs text-gray-600 mt-1">Auto-Synced</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{companyDataStats.manual}</p>
                  <p className="text-xs text-gray-600 mt-1">Manual Entries</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{companyDataStats.total}</p>
                  <p className="text-xs text-gray-600 mt-1">Total Training Data</p>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Automatic Sync Enabled</p>
                    <p className="text-xs text-gray-600">
                      Your chatbot automatically learns from your company profile, products, FAQs, mission, vision, and website intelligence data. Updates happen in real-time when you modify your company information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Training Form */}
            {showAddTraining && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">New Training Entry</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newTraining.category}
                      onChange={(e) => setNewTraining({ ...newTraining, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="company_info">Company Info</option>
                      <option value="product_info">Product Info</option>
                      <option value="faq">FAQ</option>
                      <option value="sales_script">Sales Script</option>
                      <option value="objection_handler">Objection Handler</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question / Trigger
                    </label>
                    <input
                      type="text"
                      value={newTraining.question}
                      onChange={(e) => setNewTraining({ ...newTraining, question: e.target.value })}
                      placeholder="e.g., What is your pricing?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer / Response
                    </label>
                    <textarea
                      value={newTraining.answer}
                      onChange={(e) => setNewTraining({ ...newTraining, answer: e.target.value })}
                      rows={4}
                      placeholder="e.g., Our pricing starts at ₱999/month..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTraining.tags}
                      onChange={(e) => setNewTraining({ ...newTraining, tags: e.target.value })}
                      placeholder="e.g., pricing, cost, payment"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={addTrainingData}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Add Entry
                    </button>
                    <button
                      onClick={() => setShowAddTraining(false)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Training Data List */}
            <div className="space-y-3">
              {trainingData.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Training Data Yet</h3>
                  <p className="text-gray-600 mb-4">Add custom training data to make your chatbot smarter</p>
                  <button
                    onClick={() => setShowAddTraining(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Add First Entry
                  </button>
                </div>
              ) : (
                trainingData.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    {editingId === item.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <select
                            value={editData.category}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="company_info">Company Info</option>
                            <option value="product_info">Product Info</option>
                            <option value="faq">FAQ</option>
                            <option value="sales_script">Sales Script</option>
                            <option value="objection_handler">Objection Handler</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Question / Trigger</label>
                          <input
                            type="text"
                            value={editData.question}
                            onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Answer / Response</label>
                          <textarea
                            value={editData.answer}
                            onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={editData.tags}
                            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              {item.category}
                            </span>
                            {item.auto_synced && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Auto-Synced
                              </span>
                            )}
                            {!item.is_active && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-gray-900 mb-1">{item.question}</div>
                          <div className="text-sm text-gray-600">{item.answer}</div>
                          {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {item.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleTrainingActive(item.id, item.is_active)}
                            className={`p-2 rounded-lg transition-colors ${
                              item.is_active
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={item.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          {!item.auto_synced && (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Edit training data"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteTrainingData(item.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="Delete training data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {item.auto_synced && (
                            <>
                              <div className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed" title="Auto-synced data cannot be edited">
                                <Edit className="w-4 h-4" />
                              </div>
                              <div className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed" title="Auto-synced data cannot be deleted">
                                <Trash2 className="w-4 h-4" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Integrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Facebook', 'Slack', 'WhatsApp', 'Telegram'].map((platform) => {
                const integration = integrations.find(i => i.platform.toLowerCase() === platform.toLowerCase());
                return (
                  <div key={platform} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Link2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{platform}</div>
                          <div className="text-xs text-gray-600">
                            {integration?.is_enabled ? 'Connected' : 'Not connected'}
                          </div>
                        </div>
                      </div>
                      {integration && (
                        <button
                          onClick={() => toggleIntegration(integration.id, integration.is_enabled)}
                          className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            integration.is_enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {integration.is_enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect your chatbot to {platform} for seamless communication
                    </p>
                    <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                      {integration ? 'Configure' : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">Total Conversations</div>
                <div className="text-3xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-500 mt-1">All time</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">Total Messages</div>
                <div className="text-3xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-500 mt-1">All time</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">Avg Response Time</div>
                <div className="text-3xl font-bold text-gray-900">0ms</div>
                <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Yet</h3>
              <p className="text-gray-600">Start chatting to see your analytics data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
