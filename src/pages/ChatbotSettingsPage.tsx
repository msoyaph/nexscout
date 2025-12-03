import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Copy, Check, ExternalLink, Save, Facebook, MessageSquare, Phone, Send, Webhook, Key, Link, AlertCircle, Database, Plus, Sparkles, RefreshCw, Trash2, Power, X, Edit, Lock, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ChatbotSettingsPageProps {
  onBack?: () => void;
  onNavigate?: (page: string, options?: any) => void;
}

export default function ChatbotSettingsPage({ onBack, onNavigate }: ChatbotSettingsPageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'training' | 'integrations'>('settings');
  const [settings, setSettings] = useState<any>(null);
  const [chatSlug, setChatSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [integrations, setIntegrations] = useState({
    facebook_page_id: '',
    facebook_page_token: '',
    messenger_enabled: false,
    whatsapp_phone: '',
    whatsapp_token: '',
    telegram_bot_token: '',
    webhook_url: '',
    webhook_secret: ''
  });
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [loadingTraining, setLoadingTraining] = useState(false);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    category: '',
    question: '',
    answer: '',
    tags: ''
  });
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [customInstructions, setCustomInstructions] = useState('');
  const [useCustomInstructions, setUseCustomInstructions] = useState(false);
  const [overrideIntelligence, setOverrideIntelligence] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
      loadChatSlug();
      loadUserTier();
      if (activeTab === 'training') {
        loadTrainingData();
      }
    }
  }, [user, activeTab]);

  const loadUserTier = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    setSubscriptionTier(profile?.subscription_tier || 'free');
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from('chatbot_settings')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data) {
      setSettings(data);
      if (data.integrations) {
        setIntegrations({ ...integrations, ...data.integrations });
      }
      setCustomInstructions(data.custom_system_instructions || '');
      setUseCustomInstructions(data.use_custom_instructions || false);
      setOverrideIntelligence(data.instructions_override_intelligence || false);
    } else {
      setSettings({
        display_name: 'AI Assistant',
        greeting_message: 'Hi! How can I help you today?',
        tone: 'professional',
        reply_depth: 'medium',
        closing_style: 'warm',
        objection_style: 'empathetic',
        auto_qualify_threshold: 0.7,
        auto_convert_to_prospect: true,
        enabled_channels: ['web'],
        widget_color: '#3B82F6',
        widget_position: 'bottom-right',
        is_active: true,
        integrations: {}
      });
    }
  };

  const loadChatSlug = async () => {
    if (!user?.id) return;

    // Get user's unique_user_id from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('unique_user_id')
      .eq('id', user.id)
      .single();

    const uniqueUserId = profileData?.unique_user_id;

    let { data: chatbotLink } = await supabase
      .from('chatbot_links')
      .select('chatbot_id, custom_slug')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    // If no chatbot link exists, create one using unique_user_id
    if (!chatbotLink && uniqueUserId) {
      console.log('[ChatbotSettings] Creating chatbot link with unique_user_id:', uniqueUserId);

      const { data: newLink, error } = await supabase
        .from('chatbot_links')
        .insert({
          user_id: user.id,
          chatbot_id: uniqueUserId,
          is_active: true
        })
        .select('chatbot_id, custom_slug')
        .single();

      if (error) {
        console.error('[ChatbotSettings] Error creating chatbot link:', error);
        return;
      }

      chatbotLink = newLink;
    }

    if (chatbotLink) {
      setChatSlug(chatbotLink.chatbot_id);
      setCustomSlug(chatbotLink.custom_slug || '');
    }
  };

  const handleSave = async () => {
    if (!user || !settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('chatbot_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          integrations,
          custom_system_instructions: customInstructions,
          use_custom_instructions: useCustomInstructions,
          instructions_override_intelligence: overrideIntelligence,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const generateWebhookUrl = () => {
    return `https://nexscoutai.com/api/chatbot/webhook/${user?.id}`;
  };

  const generateApiToken = () => {
    return `nxs_${user?.id?.slice(0, 8)}_${Date.now().toString(36)}`;
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(generateWebhookUrl());
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const copyApiToken = () => {
    const token = generateApiToken();
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const copyChatLink = () => {
    const link = `https://nexscoutai.com/chat/${chatSlug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewChat = () => {
    window.open(`/chat/${chatSlug}`, '_blank');
  };

  const validateSlug = (slug: string): boolean => {
    if (!slug || slug.length < 4) {
      setSlugError('Slug must be at least 4 characters');
      return false;
    }
    if (slug.length > 32) {
      setSlugError('Slug must be 32 characters or less');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and dashes');
      return false;
    }
    setSlugError('');
    return true;
  };

  const updateCustomSlug = async () => {
    if (!user || !validateSlug(customSlug)) return;

    setSaving(true);
    setSlugError('');
    try {
      // Check user's subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      const tier = profile?.subscription_tier || 'free';

      // Free users cannot customize slug
      if (tier === 'free') {
        setSlugError('Custom chat links are a Pro feature. Upgrade to customize your link!');
        setSaving(false);
        // Show upgrade nudge
        if (onNavigate) {
          setTimeout(() => onNavigate('subscription'), 2000);
        }
        return;
      }

      // Check if slug is available (case-insensitive)
      const { data: existing } = await supabase
        .from('chatbot_links')
        .select('user_id')
        .ilike('custom_slug', customSlug)
        .neq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setSlugError('This slug is already taken. Please choose another.');
        setSaving(false);
        return;
      }

      // Update custom slug
      const { error } = await supabase
        .from('chatbot_links')
        .update({ custom_slug: customSlug })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsEditingSlug(false);
      alert('Chat link updated successfully!');
      await loadChatSlug(); // Reload to show new slug
    } catch (error) {
      console.error('Error updating slug:', error);
      setSlugError('Failed to update slug. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancelSlugEdit = () => {
    setCustomSlug(chatSlug);
    setIsEditingSlug(false);
    setSlugError('');
  };

  const loadTrainingData = async () => {
    if (!user) return;

    setLoadingTraining(true);
    try {
      const { data } = await supabase
        .from('public_chatbot_training_data')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      setTrainingData(data || []);

      const autoSynced = (data || []).filter(item => item.auto_synced).length;
      const manual = (data || []).filter(item => !item.auto_synced).length;
      setCompanyDataStats({
        autoSynced,
        manual,
        total: (data || []).length
      });
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoadingTraining(false);
    }
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
          await supabase.rpc('sync_company_to_public_chatbot_training', {
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
          await supabase.rpc('sync_company_intelligence_to_public_chatbot', {
            p_user_id: user.id,
            p_intelligence_id: intel.id
          });
        }
      }

      await loadTrainingData();
      alert('Company data synced successfully!');
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Failed to sync company data');
    } finally {
      setSyncing(false);
    }
  };

  const addTrainingData = async () => {
    if (!user || !newTraining.question || !newTraining.answer) return;

    try {
      const { error } = await supabase
        .from('public_chatbot_training_data')
        .insert({
          user_id: user.id,
          category: newTraining.category,
          question: newTraining.question,
          answer: newTraining.answer,
          tags: newTraining.tags.split(',').map(t => t.trim()).filter(Boolean),
          source: 'manual',
          auto_synced: false
        });

      if (!error) {
        setNewTraining({ category: 'faq', question: '', answer: '', tags: '' });
        setShowAddTraining(false);
        loadTrainingData();
      }
    } catch (error) {
      console.error('Error adding training data:', error);
      alert('Failed to add training data');
    }
  };

  const deleteTrainingData = async (id: string) => {
    try {
      await supabase
        .from('public_chatbot_training_data')
        .delete()
        .eq('id', id);

      loadTrainingData();
    } catch (error) {
      console.error('Error deleting training data:', error);
    }
  };

  const toggleTrainingActive = async (id: string, isActive: boolean) => {
    try {
      await supabase
        .from('public_chatbot_training_data')
        .update({ is_active: !isActive })
        .eq('id', id);

      loadTrainingData();
    } catch (error) {
      console.error('Error toggling training data:', error);
    }
  };

  const toggleAutoSync = async (id: string, autoSynced: boolean) => {
    try {
      await supabase
        .from('public_chatbot_training_data')
        .update({ auto_synced: !autoSynced })
        .eq('id', id);

      loadTrainingData();
    } catch (error) {
      console.error('Error toggling auto-sync:', error);
    }
  };

  const startEdit = (item: any) => {
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

    try {
      await supabase
        .from('public_chatbot_training_data')
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
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes');
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header - Facebook Style */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">AI Chatbot Settings</h1>
              <p className="text-xs text-gray-600 truncate hidden sm:block">Configure your public-facing AI assistant</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold flex-shrink-0 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
            <span className="sm:hidden">{saving ? 'Saving' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Compact Tabs - Facebook Style */}
      <div className="bg-white border-b border-gray-200 sticky top-[53px] sm:top-[57px] z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 font-semibold text-sm sm:text-base whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`px-3 py-2 font-semibold text-sm sm:text-base whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'training'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Training Data</span>
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-3 py-2 font-semibold text-sm sm:text-base whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'integrations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Integrations
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-3">
        {activeTab === 'settings' && (
          <>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={settings.display_name}
                onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Cliff's AI Assistant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greeting Message
              </label>
              <textarea
                value={settings.greeting_message}
                onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="The first message visitors will see..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personality & Tone</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {['friendly', 'professional', 'persuasive', 'casual', 'taglish'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSettings({ ...settings, tone })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.tone === tone
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reply Length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['short', 'medium', 'long'].map((depth) => (
                  <button
                    key={depth}
                    onClick={() => setSettings({ ...settings, reply_depth: depth })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.reply_depth === depth
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {depth.charAt(0).toUpperCase() + depth.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objection Handling Style
              </label>
              <select
                value={settings.objection_style}
                onChange={(e) => setSettings({ ...settings, objection_style: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="empathetic">Empathetic</option>
                <option value="direct">Direct</option>
                <option value="consultative">Consultative</option>
                <option value="educational">Educational</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-Convert to Prospect</p>
                <p className="text-sm text-gray-600">Automatically create prospects from qualified chats</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, auto_convert_to_prospect: !settings.auto_convert_to_prospect })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.auto_convert_to_prospect ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.auto_convert_to_prospect ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Qualification Threshold
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.auto_qualify_threshold}
                  onChange={(e) => setSettings({ ...settings, auto_qualify_threshold: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                  {Math.round(settings.auto_qualify_threshold * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Chats scoring above this threshold will automatically convert to prospects
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Widget Customization</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.widget_color}
                  onChange={(e) => setSettings({ ...settings, widget_color: e.target.value })}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.widget_color}
                  onChange={(e) => setSettings({ ...settings, widget_color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Position
              </label>
              <select
                value={settings.widget_position}
                onChange={(e) => setSettings({ ...settings, widget_position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Chatbot Active</p>
              <p className="text-sm text-gray-600">Enable or disable your AI chatbot</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, is_active: !settings.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.is_active ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
          </>
        )}

        {/* Training Data Tab */}
        {activeTab === 'training' && (
          <div className="space-y-3">
            {/* Compact Header - Facebook Style */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Training Data</h2>
                    <p className="text-xs text-gray-500">{companyDataStats.total} total entries</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddTraining(!showAddTraining)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              </div>
            </div>

            {/* AI System Instructions - Compact Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2.5">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">AI System Instructions</h3>
                    <p className="text-xs opacity-90">Power user mode</p>
                  </div>
                </div>
              </div>

              {/* Enable Custom Instructions Toggle */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Enable Custom Instructions</p>
                    <p className="text-xs text-gray-600 truncate">Custom AI behavior & flow</p>
                  </div>
                  <button
                    onClick={() => setUseCustomInstructions(!useCustomInstructions)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${
                      useCustomInstructions ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        useCustomInstructions ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {useCustomInstructions && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Override Intelligence</p>
                      <p className="text-xs text-gray-600 truncate">Replace auto company data</p>
                    </div>
                    <button
                      onClick={() => setOverrideIntelligence(!overrideIntelligence)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${
                        overrideIntelligence ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          overrideIntelligence ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Instructions Editor */}
              {useCustomInstructions && (
                <>
                  <div className="border-t border-gray-200 p-3">
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Example: You are a sales assistant for [Company Name]...&#10;&#10;Products: Product A ($99/mo), Product B ($199/mo)&#10;&#10;Flow: 1) Greet 2) Qualify 3) Match product 4) Share pricing 5) Book demo&#10;&#10;Contact: sales@company.com, calendly.com/demo"
                      rows={Math.max(8, Math.ceil(customInstructions.length / 100))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 font-mono text-xs resize-y"
                      style={{ minHeight: '200px', maxHeight: '400px' }}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-gray-500">{customInstructions.length} chars</p>
                      {overrideIntelligence && (
                        <p className="text-xs text-orange-600 font-medium">⚠️ Override ON</p>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Tips */}
                  <details className="border-t border-gray-200">
                    <summary className="px-3 py-2 text-xs font-semibold text-blue-700 cursor-pointer hover:bg-blue-50 flex items-center gap-1">
                      💡 Tips & Examples
                    </summary>
                    <div className="px-3 py-2 bg-blue-50 text-xs text-gray-700 space-y-1">
                      <p>• Define products, pricing & unique value</p>
                      <p>• Set conversation goals (demo, qualify, answer)</p>
                      <p>• Add contact methods & booking links</p>
                      <p>• Specify tone (professional, casual, friendly)</p>
                      <p>• Include objection handlers & FAQs</p>
                    </div>
                  </details>
                </>
              )}
            </div>

            {/* Company Data Integration Status - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white flex-1 min-w-0">
                  <Sparkles className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate">Auto-Sync Intelligence</h3>
                    <p className="text-xs opacity-90 truncate">Company data synced automatically</p>
                  </div>
                </div>
                <button
                  onClick={manualSyncCompanyData}
                  disabled={syncing}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{syncing ? 'Syncing' : 'Sync'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-px bg-gray-200">
                <div className="bg-white p-2.5 text-center">
                  <p className="text-lg font-bold text-green-600">{companyDataStats.autoSynced}</p>
                  <p className="text-xs text-gray-600">Auto</p>
                </div>
                <div className="bg-white p-2.5 text-center">
                  <p className="text-lg font-bold text-gray-900">{companyDataStats.manual}</p>
                  <p className="text-xs text-gray-600">Manual</p>
                </div>
                <div className="bg-white p-2.5 text-center">
                  <p className="text-lg font-bold text-blue-600">{companyDataStats.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>

              <div className="p-3 bg-green-50 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">
                    Chatbot knows your company info, products, pricing, FAQs, mission & vision automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Add Training Modal */}
            {showAddTraining && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">Add Custom Training Entry</h3>
                      <button
                        onClick={() => setShowAddTraining(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newTraining.category}
                        onChange={(e) => setNewTraining({ ...newTraining, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="company_info">Company Info</option>
                        <option value="product_info">Product Info</option>
                        <option value="service_info">Service Info</option>
                        <option value="pricing">Pricing</option>
                        <option value="faq">FAQ</option>
                        <option value="objection_handler">Objection Handler</option>
                        <option value="appointment_booking">Appointment Booking</option>
                        <option value="contact_info">Contact Info</option>
                        <option value="support">Support</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Question / Trigger
                      </label>
                      <input
                        type="text"
                        value={newTraining.question}
                        onChange={(e) => setNewTraining({ ...newTraining, question: e.target.value })}
                        placeholder="e.g., How much does it cost?"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chatbot Answer
                      </label>
                      <textarea
                        value={newTraining.answer}
                        onChange={(e) => setNewTraining({ ...newTraining, answer: e.target.value })}
                        rows={4}
                        placeholder="e.g., Our basic plan starts at ₱999/month..."
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
                  </div>

                  <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex gap-3">
                    <button
                      onClick={addTrainingData}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Add Entry
                    </button>
                    <button
                      onClick={() => setShowAddTraining(false)}
                      className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Training Data List - Compact */}
            <div className="space-y-2">
              {loadingTraining ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <Database className="w-10 h-10 text-gray-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              ) : trainingData.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <Database className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No Training Data</h3>
                  <p className="text-xs text-gray-600 mb-3">Add entries to train your AI</p>
                  <button
                    onClick={() => setShowAddTraining(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                  >
                    Add First Entry
                  </button>
                </div>
              ) : (
                trainingData.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {editingId === item.id ? (
                      <div className="p-3 space-y-2.5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <select
                            value={editData.category}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="company_info">Company Info</option>
                            <option value="product_info">Product Info</option>
                            <option value="service_info">Service Info</option>
                            <option value="pricing">Pricing</option>
                            <option value="faq">FAQ</option>
                            <option value="objection_handler">Objection Handler</option>
                            <option value="appointment_booking">Appointment Booking</option>
                            <option value="contact_info">Contact Info</option>
                            <option value="support">Support</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Customer Question / Trigger</label>
                          <input
                            type="text"
                            value={editData.question}
                            onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Chatbot Answer</label>
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
                    <>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              {item.category}
                            </span>
                            {item.auto_synced && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                Auto
                              </span>
                            )}
                            {!item.is_active && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!item.auto_synced && (
                              <>
                                <button
                                  onClick={() => startEdit(item)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteTrainingData(item.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{item.question}</div>
                        <div className="text-xs text-gray-600 line-clamp-2">{item.answer}</div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {item.tags.slice(0, 4).map((tag: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 4 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                +{item.tags.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Action Bar */}
                      <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => toggleTrainingActive(item.id, item.is_active)}
                          className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                            item.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {item.is_active ? 'Active' : 'Inactive'}
                        </button>
                        {item.auto_synced && (
                          <button
                            onClick={() => toggleAutoSync(item.id, item.auto_synced)}
                            className="text-xs font-medium text-orange-600 hover:text-orange-700 px-2 py-1 hover:bg-orange-50 rounded transition-colors"
                          >
                            Disable Auto-Sync
                          </button>
                        )}
                      </div>
                    </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-3">
            {/* Your AI Chat Link Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Your AI Chat Link</h2>
                </div>
                {!isEditingSlug && (
                  subscriptionTier === 'free' ? (
                    <button
                      onClick={() => {
                        setSlugError('Custom chat links are a Pro feature. Upgrade to customize your link!');
                        if (onNavigate) {
                          setTimeout(() => onNavigate('subscription'), 2000);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors text-sm font-semibold"
                    >
                      <Lock className="w-4 h-4" />
                      Locked
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingSlug(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Customize
                    </button>
                  )
                )}
              </div>

              {!isEditingSlug ? (
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 space-y-3">
                  {/* Chat Link Display */}
                  <div>
                    <div className="text-sm text-white/70 mb-2">Your chatbot link:</div>
                    <div className="bg-white/10 rounded-lg p-3 break-all">
                      <code className="text-sm font-mono text-white">
                        https://nexscoutai.com/chat/{customSlug || chatSlug}
                      </code>
                    </div>
                  </div>

                  {/* Pro Custom Link Status */}
                  {customSlug && subscriptionTier !== 'free' && (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-yellow-200 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="font-semibold">Pro Custom Link Active</span>
                      </div>
                      <div className="text-xs text-yellow-100/80">
                        Custom link will revert to /{chatSlug} if you downgrade
                      </div>
                    </div>
                  )}

                  {/* Free tier lock message */}
                  {subscriptionTier === 'free' && (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2 text-sm text-yellow-100">
                        <Crown className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold mb-1">Upgrade to Pro to customize</div>
                          <div className="text-xs text-yellow-100/80">
                            Create a memorable custom link like /chat/yourname
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={copyChatLink}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                    <button
                      onClick={previewChat}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <label className="block text-sm text-white/90 mb-2 font-medium">Customize your link:</label>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-white/70">nexscoutai.com/chat/</span>
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => {
                          setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                          setSlugError('');
                        }}
                        className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-lg text-sm font-mono focus:ring-2 focus:ring-white/50 focus:outline-none"
                        placeholder="your-custom-link"
                      />
                    </div>
                    {slugError && (
                      <div className="flex items-start gap-2 text-yellow-200 text-sm mt-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{slugError}</span>
                      </div>
                    )}
                    <p className="text-xs text-white/70 mt-2">
                      Use lowercase letters, numbers, and dashes only (4-32 characters)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={updateCustomSlug}
                      disabled={saving || !!slugError}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Custom Link
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelSlugEdit}
                      disabled={saving}
                      className="px-4 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3rd Party Integrations */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Link className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3rd Party Integrations</h3>
                  <p className="text-sm text-gray-600">Connect your chatbot to Facebook, WhatsApp, Telegram, and more</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Facebook className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Facebook Page & Messenger</h4>
                      <p className="text-xs text-gray-600">Connect to Facebook Page for Messenger integration</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facebook Page ID
                      </label>
                      <input
                        type="text"
                        value={integrations.facebook_page_id}
                        onChange={(e) => setIntegrations({ ...integrations, facebook_page_id: e.target.value })}
                        placeholder="Enter your Facebook Page ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Access Token
                      </label>
                      <input
                        type="password"
                        value={integrations.facebook_page_token}
                        onChange={(e) => setIntegrations({ ...integrations, facebook_page_token: e.target.value })}
                        placeholder="Enter your Page Access Token"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Enable Messenger</p>
                        <p className="text-xs text-gray-500">Respond to messages via Facebook Messenger</p>
                      </div>
                      <button
                        onClick={() => setIntegrations({ ...integrations, messenger_enabled: !integrations.messenger_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          integrations.messenger_enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            integrations.messenger_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-900">
                        Get your Page ID and Access Token from <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Facebook Developers</a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">WhatsApp Business</h4>
                      <p className="text-xs text-gray-600">Connect to WhatsApp Business API</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Phone Number
                      </label>
                      <input
                        type="text"
                        value={integrations.whatsapp_phone}
                        onChange={(e) => setIntegrations({ ...integrations, whatsapp_phone: e.target.value })}
                        placeholder="+1234567890"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Business API Token
                      </label>
                      <input
                        type="password"
                        value={integrations.whatsapp_token}
                        onChange={(e) => setIntegrations({ ...integrations, whatsapp_token: e.target.value })}
                        placeholder="Enter your WhatsApp API Token"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Send className="w-6 h-6 text-blue-500" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Telegram Bot</h4>
                      <p className="text-xs text-gray-600">Connect your Telegram Bot</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bot Token
                      </label>
                      <input
                        type="password"
                        value={integrations.telegram_bot_token}
                        onChange={(e) => setIntegrations({ ...integrations, telegram_bot_token: e.target.value })}
                        placeholder="Enter your Telegram Bot Token"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-900">
                        Create a bot using <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline font-medium">@BotFather</a> on Telegram
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Webhook className="w-6 h-6 text-purple-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Webhook Integration</h4>
                      <p className="text-xs text-gray-600">Receive chatbot events via webhook</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Webhook URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={integrations.webhook_url}
                          onChange={(e) => setIntegrations({ ...integrations, webhook_url: e.target.value })}
                          placeholder="https://your-domain.com/webhook"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook Secret (for verification)
                      </label>
                      <input
                        type="password"
                        value={integrations.webhook_secret}
                        onChange={(e) => setIntegrations({ ...integrations, webhook_secret: e.target.value })}
                        placeholder="Enter a secure secret key"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Key className="w-6 h-6 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">API Credentials</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook Endpoint (for incoming messages)
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono break-all">
                          {generateWebhookUrl()}
                        </code>
                        <button
                          onClick={copyWebhookUrl}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Use this URL in your 3rd party platform webhook settings</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Token (for authentication)
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono break-all">
                          {generateApiToken()}
                        </code>
                        <button
                          onClick={copyApiToken}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Include this token in Authorization header</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
