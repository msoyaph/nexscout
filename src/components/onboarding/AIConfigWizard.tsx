/**
 * AI Config Wizard - 3-Step Guided Setup
 * Step 1: Company Information
 * Step 2: Contact Information
 * Step 3: AI Magic Auto-Configured & System Template (Combined)
 */

import { useState, useEffect } from 'react';
import { Sparkles, Phone, Mail, ChevronLeft, ChevronRight, Check, Zap, Building2, MessageCircle, Settings, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AiSystemInstructionsEditor from '../editor/AiSystemInstructionsEditor';

interface AIConfigWizardProps {
  userId: string;
  userEmail: string;
  companyName: string;
  industry: string;
  companyMatch?: any | null;
  onComplete: () => void;
  onSkip: () => void;
}

export default function AIConfigWizard({
  userId,
  userEmail,
  companyName,
  industry,
  companyMatch,
  onComplete,
  onSkip
}: AIConfigWizardProps) {
  const { signOut, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [matchedTemplate, setMatchedTemplate] = useState<any | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // Form State
  const [companyDesc, setCompanyDesc] = useState('');
  const [products, setProducts] = useState([{ name: '', description: '', image: null as File | null }]);
  const [contactInfo, setContactInfo] = useState({ phone: '', email: userEmail });
  const [aiInstructions, setAiInstructions] = useState('');
  const [useTemplateInstructions, setUseTemplateInstructions] = useState(true);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [editableInstructions, setEditableInstructions] = useState('');
  
  // Auto-detected settings
  const [autoSettings, setAutoSettings] = useState({
    tone: getToneFromIndustry(industry),
    chatFlow: getDefaultChatFlow(industry),
    microCTAs: getDefaultMicroCTAs(industry),
  });

  const totalSteps = 3;

  useEffect(() => {
    loadTemplateData();
    loadProfileContactInfo();
  }, [userId]);

  // Load existing phone and email from user's profile
  async function loadProfileContactInfo() {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone, email')
        .eq('id', userId)
        .maybeSingle();

      if (!error && profile) {
        setContactInfo({
          phone: profile.phone || '',
          email: profile.email || userEmail,
        });
        console.log('[AIConfigWizard] Loaded contact info from profile:', {
          phone: profile.phone || 'not set',
          email: profile.email || userEmail
        });
      }
    } catch (err) {
      console.error('[AIConfigWizard] Error loading profile contact info:', err);
    }
  }

  async function loadTemplateData() {
    try {
      setLoadingTemplate(true);
      
      console.log('[AIConfigWizard] 🔍 Loading template for company:', companyName);
      
      // Query admin_companies directly by name match (prioritize name over industry)
      let matchedCompany = null;
      let companyError = null;
      
      // Try exact name match first
      const { data: exactMatch, error: exactError } = await supabase
        .from('admin_companies')
        .select('id, name, industry, logo_url')
        .ilike('name', `%${companyName}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (exactMatch) {
        matchedCompany = exactMatch;
      } else {
        // Fallback: try industry match
        const { data: industryMatch, error: industryError } = await supabase
          .from('admin_companies')
          .select('id, name, industry, logo_url')
          .ilike('industry', `%${industry}%`)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        
        matchedCompany = industryMatch;
        companyError = industryError;
      }
      
      console.log('[AIConfigWizard] 🔍 Company match result:', { matchedCompany, companyError });

      if (matchedCompany) {
        console.log('[AIConfigWizard] ✅ Found matching template:', matchedCompany.name);
        setMatchedTemplate(matchedCompany); // Store for debug display
        
        // Load AI instructions from template
        const { data: knowledgePost, error: aiError } = await supabase
          .from('company_knowledge_posts')
          .select('content, title')
          .eq('admin_company_id', matchedCompany.id)
          .eq('post_type', 'ai_system_instructions')
          .limit(1)
          .maybeSingle();

        console.log('[AIConfigWizard] 🔍 AI instructions result:', { 
          found: !!knowledgePost, 
          length: knowledgePost?.content?.length || 0,
          error: aiError 
        });

        if (knowledgePost?.content) {
          console.log('[AIConfigWizard] ✅ Loaded AI instructions:', knowledgePost.content.length, 'chars');
          setAiInstructions(knowledgePost.content);
          setEditableInstructions(knowledgePost.content);
          setUseTemplateInstructions(true);
        } else {
          console.log('[AIConfigWizard] ⚠️ No AI instructions found for company');
        }

      } else {
        console.log('[AIConfigWizard] ❌ No matching company template found');
        setMatchedTemplate(null);
      }
    } catch (error) {
      console.error('[AIConfigWizard] Error loading template:', error);
    } finally {
      setLoadingTemplate(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Use edited template instructions if toggle is ON and template exists
      // Otherwise use form-built instructions
      const finalInstructions = (useTemplateInstructions && editableInstructions) 
        ? editableInstructions 
        : buildSystemInstructions();
      
      console.log('[AIConfigWizard] Saving instructions:', {
        length: finalInstructions.length,
        useTemplate: useTemplateInstructions,
        hasTemplate: !!editableInstructions
      });

      // First, delete any existing chatbot_settings to avoid duplicate key error
      await supabase
        .from('chatbot_settings')
        .delete()
        .eq('user_id', userId);

      // Then insert fresh with template instructions and toggles ON by default
      const { error } = await supabase
        .from('chatbot_settings')
        .insert({
          user_id: userId,
          tone: autoSettings.tone,
          is_configured: true,
          // Save template instructions to custom_system_instructions
          custom_system_instructions: finalInstructions,
          // Enable Custom Instructions by default (ON)
          use_custom_instructions: true,
          // Override Intelligence by default (ON)
          instructions_override_intelligence: true,
        });

      if (error) {
        console.error('[AIConfigWizard] Chatbot settings error:', error);
        throw error;
      }
      
      console.log('[AIConfigWizard] ✅ Chatbot configured with template instructions!');
      console.log('[AIConfigWizard] ✅ Custom Instructions: ON, Override Intelligence: ON');

      // Save phone and email to profiles table (synced with Edit Profile)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: contactInfo.phone || null,
          email: contactInfo.email || userEmail,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('[AIConfigWizard] Profile update error:', profileError);
        // Don't throw - this is not critical for onboarding completion
      } else {
        console.log('[AIConfigWizard] ✅ Contact info saved to profile:', {
          phone: contactInfo.phone || 'not set',
          email: contactInfo.email
        });
        // Refresh profile to sync with other parts of the app
        await refreshProfile();
      }

      console.log('[AIConfigWizard] ✅ AI configured and onboarding complete!');
      onComplete();
    } catch (error: any) {
      console.error('[AIConfigWizard] Error:', error);
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function buildSystemInstructions(): string {
    return `You are a sales assistant for ${companyName} (${industry}).

${companyDesc}

**Products:**
${products.filter(p => p.name).map(p => `- ${p.name}: ${p.description}`).join('\n')}

**Contact:**
- Email: ${contactInfo.email}
${contactInfo.phone ? `- Phone: ${contactInfo.phone}` : ''}

**Tone:** ${autoSettings.tone}

**Conversation Flow:**
${autoSettings.chatFlow}

**Micro CTAs:**
${autoSettings.microCTAs.join('\n')}`;
  }

  const steps = [
    { number: 1, title: 'Company Information', icon: Building2 },
    { number: 2, title: 'Contact Information', icon: MessageCircle },
    { number: 3, title: 'AI Configuration', icon: Sparkles },
  ];

  const canGoNext = () => {
    // All steps are optional - user can proceed anytime
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2">
      <div className="max-w-4xl mx-auto py-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-3xl shadow-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    {/* Circle */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white scale-110 shadow-lg'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="mt-2 text-center">
                      <div className={`text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        Step {step.number}
                      </div>
                      <div className={`text-xs mt-1 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500'} hidden md:block`}>
                        {step.title}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    <Building2 className="w-8 h-8 inline mr-2 text-blue-500" />
                    Company Information
                  </h2>
                  <p className="text-gray-600">Tell us about your company</p>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-200 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      disabled
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-500"
                    />
                    <p className="text-xs text-green-600 mt-1">✅ Pre-populated from signup</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={industry}
                      disabled
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-500"
                    />
                    <p className="text-xs text-green-600 mt-1">✅ From your wizard selection</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Short description about your company *
                    </label>
                    <textarea
                      value={companyDesc}
                      onChange={(e) => setCompanyDesc(e.target.value)}
                      placeholder="We help Filipinos achieve financial freedom through health and wellness products..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    <MessageCircle className="w-8 h-8 inline mr-2 text-pink-500" />
                    Contact Information
                  </h2>
                  <p className="text-gray-600">How can customers reach you?</p>
                </div>

                <div className="p-6 bg-pink-50 rounded-2xl border-2 border-pink-200 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      placeholder="+63 912 345 6789"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used for SMS campaigns, text notifications, and authentication
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used for email marketing, notifications, and authentication
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: AI Magic Auto-Configured & System Template (Combined) */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    <Sparkles className="w-8 h-8 inline mr-2 text-green-500" />
                    AI Configuration
                  </h2>
                  <p className="text-gray-600">Review your AI settings and template</p>
                </div>

                {/* Compact Auto-Configured Section - Facebook Inspired */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-900">✨ Automatically Configured</span>
                      <span className="text-xs text-green-700 ml-auto">Based on "{industry}"</span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {/* Conversation Tone - Compact Card */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-700 mb-0.5">Conversation Tone</div>
                        <div className="text-xs text-gray-500">
                          {autoSettings.tone === 'taglish' 
                            ? 'Perfect for Filipino market - uses "po", casual mix of English/Tagalog' 
                            : 'Professional and friendly tone'}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap ml-3">
                        {autoSettings.tone === 'taglish' ? 'Taglish (Warm & Human)' : 'Professional'}
                      </span>
                    </div>

                    {/* Sales Chat Flow - Compact */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-1.5">Sales Chat Flow</div>
                      <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {autoSettings.chatFlow}
                      </div>
                    </div>

                    {/* Micro CTAs - Compact */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-1.5">
                        Ready-to-Use Micro CTAs ({autoSettings.microCTAs.length})
                      </div>
                      <div className="space-y-1">
                        {autoSettings.microCTAs.slice(0, 2).map((cta, i) => (
                          <div key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{cta}</span>
                          </div>
                        ))}
                        {autoSettings.microCTAs.length > 2 && (
                          <div className="text-xs text-gray-500 italic pl-4.5">
                            +{autoSettings.microCTAs.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI System Template Section */}
                {aiInstructions ? (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-900">{companyName} AI System Instructions</span>
                        </div>
                        <button
                          onClick={() => setUseTemplateInstructions(!useTemplateInstructions)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            useTemplateInstructions ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              useTemplateInstructions ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 transition-all ${useTemplateInstructions ? 'opacity-100' : 'opacity-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-700">
                          Template ({editableInstructions.length.toLocaleString()} chars)
                        </div>
                        <button
                          onClick={() => setShowInstructionsModal(true)}
                          disabled={!useTemplateInstructions}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          <Settings className="w-3 h-3" />
                          View & Edit
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200">
                        {editableInstructions.substring(0, 200)}...
                      </div>
                    </div>

                    {!useTemplateInstructions && (
                      <div className="px-4 pb-4">
                        <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs text-yellow-800">
                            ⚠️ Template disabled. AI will use basic instructions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">⚠️</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-yellow-900 mb-0.5">No Template Found</p>
                        <p className="text-xs text-yellow-800">
                          Template loading failed. Your AI will use basic instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions Editor Modal */}
            {showInstructionsModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowInstructionsModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {companyName} AI System Instructions
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Customize your AI chatbot's behavior, tone, and responses
                        </p>
                      </div>
                      <button
                        onClick={() => setShowInstructionsModal(false)}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Modal Body - Editor */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <AiSystemInstructionsEditor
                      value={editableInstructions}
                      onChange={setEditableInstructions}
                      label="AI System Instructions"
                      helperText="Tip: You can format text, add images, attach files, and embed YouTube videos."
                      placeholder="Enter AI system instructions..."
                      userId={userId}
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-gray-200 flex justify-between items-center gap-3">
                    <button
                      onClick={() => {
                        setEditableInstructions(aiInstructions);
                        alert('Restored to original template!');
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                    >
                      Reset to Original
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowInstructionsModal(false)}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowInstructionsModal(false);
                          alert('✅ Changes saved! Click "Activate" to apply.');
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all shadow-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Next/Finish Button */}
            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Activating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Activate My AI Chatbot
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Logout Option - Below Action Buttons */}
        {currentStep === 3 && (
          <div className="text-center" style={{ marginTop: '30px' }}>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to logout? Your progress will be saved.')) {
                  await signOut();
                }
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline flex items-center gap-1 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Functions
function getToneFromIndustry(industry: string): string {
  const taglishIndustries = ['mlm', 'MLM / Network Marketing', 'Health & Wellness', 'ecommerce', 'dropshipping', 'direct_selling'];
  return taglishIndustries.some(i => industry.toLowerCase().includes(i.toLowerCase())) 
    ? 'taglish' 
    : 'professional';
}

function getDefaultChatFlow(industry: string): string {
  const flows: Record<string, string> = {
    'mlm': `1. Warm greeting (Taglish OK!)
2. Ask needs: "Health or income po kayo?"
3. Recommend correct package
4. Share benefits clearly
5. Soft CTA: "Ready to order?" or "Join team?"
6. Offer COD & payment options
7. Stay supportive, never pushy`,
    
    'Health & Wellness': `1. Warm greeting
2. Ask about health goals
3. Recommend products
4. Explain benefits
5. Share testimonials
6. Offer purchase options`,
  };

  return flows[industry] || flows['mlm'];
}

function getDefaultMicroCTAs(industry: string): string[] {
  const ctas: Record<string, string[]> = {
    'mlm': [
      '"Ready po to order? COD available."',
      '"Gusto n\'yo po ba ng explanation?"',
      '"Pwede ko po kayo i-book quick call, 10 mins lang 😊"',
      '"Health or income muna po tayo?"',
      '"May promo kami ngayon — interested ka?"',
      '"Join our team! Training and support kami."',
    ],
    'ecommerce': [
      '"Ready to order? COD or GCash available!"',
      '"Check mo po yung products - may promo ngayon!"',
      '"Magkano total? Shipping included na!"',
      '"Ilang days delivery? 2-3 days lang!"',
      '"Gusto mo i-add to cart?"',
      '"COD po or GCash ang payment?"',
    ],
    'insurance': [
      '"Free consultation call po - I can assess your needs."',
      '"I can prepare a personalized quote for you."',
      '"What coverage amount are you looking for?"',
      '"Family protection, health, or education plan?"',
      '"Comfortable premium range monthly?"',
    ],
    'real_estate': [
      '"I can show you properties in your price range."',
      '"Free property consultation - available for a call?"',
      '"When can we schedule a property viewing?"',
      '"Interested in financing options?"',
      '"Reserve now and secure your investment."',
    ],
  };

  // Match by key or partial match
  const industryLower = industry.toLowerCase();
  for (const [key, value] of Object.entries(ctas)) {
    if (industryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(industryLower)) {
      return value;
    }
  }

  return ctas['mlm']; // Default fallback
}

