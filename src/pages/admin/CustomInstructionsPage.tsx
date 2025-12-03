/**
 * Custom Instructions Admin Page
 *
 * Allows users to configure their AI behavior, tone, persona, and overrides.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomInstructionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [tone, setTone] = useState('');
  const [persona, setPersona] = useState('');
  const [sellingStyle, setSellingStyle] = useState('');
  const [language, setLanguage] = useState('taglish');
  const [forbiddenPhrases, setForbiddenPhrases] = useState('');
  const [requiredPhrases, setRequiredPhrases] = useState('');

  // Behavior
  const [aggressiveness, setAggressiveness] = useState('medium');
  const [empathyLevel, setEmpathyLevel] = useState('medium');

  // Chatbot
  const [greetingStyle, setGreetingStyle] = useState('warm');
  const [closingStyle, setClosingStyle] = useState('soft');

  // Overrides
  const [companyDataOverride, setCompanyDataOverride] = useState('');
  const [productDataOverride, setProductDataOverride] = useState('');

  // Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);

  // Load existing instructions
  useEffect(() => {
    if (user) {
      loadInstructions();
      loadConflicts();
      loadPerformance();
    }
  }, [user]);

  const loadInstructions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('custom_instructions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setTone(data.tone || '');
      setPersona(data.persona || '');
      setSellingStyle(data.selling_style || '');
      setLanguage(data.preferred_language || 'taglish');
      setForbiddenPhrases((data.forbidden_phrases || []).join(', '));
      setRequiredPhrases((data.required_phrases || []).join(', '));

      const behavior = data.ai_behavior_overrides || {};
      setAggressiveness(behavior.aggressiveness || 'medium');
      setEmpathyLevel(behavior.empathyLevel || 'medium');

      const chatbot = data.chatbot_overrides || {};
      setGreetingStyle(chatbot.greetingStyle || 'warm');
      setClosingStyle(chatbot.closingStyle || 'soft');

      setCompanyDataOverride(JSON.stringify(data.custom_company_data || {}, null, 2));
      setProductDataOverride(JSON.stringify(data.custom_product_data || {}, null, 2));
    }

    setLoading(false);
  };

  const loadConflicts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('custom_instruction_conflicts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('severity', { ascending: false });

    setConflicts(data || []);
  };

  const loadPerformance = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('custom_instruction_performance')
      .select('*')
      .eq('user_id', user.id)
      .order('improvement_vs_baseline', { ascending: false })
      .limit(5);

    if (data && data.length > 0) {
      setPerformance(data);
    }
  };

  const saveInstructions = async () => {
    if (!user) return;

    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase
        .from('custom_instructions')
        .upsert({
          user_id: user.id,
          tone,
          persona,
          selling_style: sellingStyle,
          preferred_language: language,
          forbidden_phrases: forbiddenPhrases.split(',').map(p => p.trim()).filter(Boolean),
          required_phrases: requiredPhrases.split(',').map(p => p.trim()).filter(Boolean),
          ai_behavior_overrides: {
            aggressiveness,
            empathyLevel,
          },
          chatbot_overrides: {
            greetingStyle,
            closingStyle,
          },
          custom_company_data: companyDataOverride ? JSON.parse(companyDataOverride) : {},
          custom_product_data: productDataOverride ? JSON.parse(productDataOverride) : {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving instructions:', error);
      alert('Error saving instructions. Please check your JSON syntax.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your AI settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Admin
          </button>

          <button
            onClick={saveInstructions}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>Saving...</>
            ) : saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Instructions
              </>
            )}
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Custom AI Instructions</h1>
        <p className="text-gray-600 mb-6">
          Configure how your AI assistant talks, thinks, and behaves. These settings have the highest priority.
        </p>

        {/* Conflicts Warning */}
        {conflicts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ {conflicts.length} Conflicts Detected</h3>
                {conflicts.slice(0, 3).map((conflict, i) => (
                  <p key={i} className="text-sm text-yellow-800 mb-1">
                    • {conflict.description}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {performance && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">📈 Your Custom Settings Are Working!</h3>
                {performance.slice(0, 2).map((perf: any, i: number) => (
                  <p key={i} className="text-sm text-green-800 mb-1">
                    • {perf.instruction_field}: +{perf.improvement_vs_baseline}% improvement
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Core Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Core Personality</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Choose tone...</option>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="christian">Christian</option>
                  <option value="consultative">Consultative</option>
                  <option value="warm">Warm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persona
                </label>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Choose persona...</option>
                  <option value="coach">Empowering Coach</option>
                  <option value="advisor">Trusted Advisor</option>
                  <option value="friend">Friendly Helper</option>
                  <option value="expert">Expert Professional</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Style
                </label>
                <select
                  value={sellingStyle}
                  onChange={(e) => setSellingStyle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Choose style...</option>
                  <option value="soft_sell">Soft Sell</option>
                  <option value="hard_close">Hard Close</option>
                  <option value="educational">Educational</option>
                  <option value="relationship_based">Relationship-Based</option>
                  <option value="consultative">Consultative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="english">English</option>
                  <option value="tagalog">Tagalog</option>
                  <option value="taglish">Taglish (Mixed)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Communication Rules */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Communication Rules</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forbidden Phrases (comma-separated)
                </label>
                <input
                  type="text"
                  value={forbiddenPhrases}
                  onChange={(e) => setForbiddenPhrases(e.target.value)}
                  placeholder="buy now, limited offer, act fast"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">AI will never use these phrases</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Phrases (comma-separated)
                </label>
                <input
                  type="text"
                  value={requiredPhrases}
                  onChange={(e) => setRequiredPhrases(e.target.value)}
                  placeholder="God bless, thank you, valued customer"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">AI will try to include these phrases</p>
              </div>
            </div>
          </div>

          {/* AI Behavior */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">AI Behavior</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aggressiveness: {aggressiveness}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aggressiveness === 'none' ? 0 : aggressiveness === 'low' ? 25 : aggressiveness === 'medium' ? 50 : aggressiveness === 'high' ? 75 : 100}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setAggressiveness(val < 20 ? 'none' : val < 40 ? 'low' : val < 60 ? 'medium' : val < 80 ? 'high' : 'very_high');
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>None</span>
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Very High</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empathy Level: {empathyLevel}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={empathyLevel === 'low' ? 25 : empathyLevel === 'medium' ? 50 : empathyLevel === 'high' ? 75 : 100}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setEmpathyLevel(val < 35 ? 'low' : val < 65 ? 'medium' : val < 90 ? 'high' : 'very_high');
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Very High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chatbot Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Chatbot Specific</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Greeting Style
                </label>
                <select
                  value={greetingStyle}
                  onChange={(e) => setGreetingStyle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="warm">Warm</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Style
                </label>
                <select
                  value={closingStyle}
                  onChange={(e) => setClosingStyle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="soft">Soft (No Pressure)</option>
                  <option value="direct">Direct</option>
                  <option value="question">Question-Based</option>
                  <option value="action">Action-Oriented</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Overrides */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Advanced Overrides (JSON)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Override auto-detected company and product data with your own.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Data Override
                </label>
                <textarea
                  value={companyDataOverride}
                  onChange={(e) => setCompanyDataOverride(e.target.value)}
                  placeholder='{"mission": "Your mission", "values": ["value1", "value2"]}'
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm h-32"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Data Override
                </label>
                <textarea
                  value={productDataOverride}
                  onChange={(e) => setProductDataOverride(e.target.value)}
                  placeholder='{"description": "Custom description", "benefits": ["benefit1"]}'
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm h-32"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveInstructions}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
