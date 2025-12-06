/**
 * AI Config Wizard - 5-Step Guided Setup
 * Step 1: Company Information
 * Step 2: Your Products
 * Step 3: Contact Information
 * Step 4: AI Magic Auto-Configured (Preview)
 * Step 5: AI System Template (Review & Customize)
 */

import { useState, useEffect } from 'react';
import { Sparkles, Upload, Globe, Phone, Mail, ChevronLeft, ChevronRight, Check, Zap, Building2, Package, MessageCircle, Settings, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

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
  const { signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [matchedTemplate, setMatchedTemplate] = useState<any | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // Form State
  const [companyDesc, setCompanyDesc] = useState('');
  const [products, setProducts] = useState([{ name: '', description: '', image: null as File | null }]);
  const [contactInfo, setContactInfo] = useState({ phone: '', email: userEmail, website: '' });
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

  const totalSteps = 5;

  useEffect(() => {
    loadTemplateData();
  }, [userId]);

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
      
      // First, delete any existing chatbot_settings to avoid duplicate key error
      await supabase
        .from('chatbot_settings')
        .delete()
        .eq('user_id', userId);

      // Then insert fresh
      const { error } = await supabase
        .from('chatbot_settings')
        .insert({
          user_id: userId,
          tone: autoSettings.tone,
          is_configured: true,
        });

      if (error) {
        console.error('[AIConfigWizard] Chatbot settings error:', error);
        throw error;
      }
      
      console.log('[AIConfigWizard] ✅ Chatbot configured!');

      // Mark onboarding complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId);

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
${contactInfo.website ? `- Website: ${contactInfo.website}` : ''}

**Tone:** ${autoSettings.tone}

**Conversation Flow:**
${autoSettings.chatFlow}

**Micro CTAs:**
${autoSettings.microCTAs.join('\n')}`;
  }

  const steps = [
    { number: 1, title: 'Company Information', icon: Building2 },
    { number: 2, title: 'Your Products', icon: Package },
    { number: 3, title: 'Contact Information', icon: MessageCircle },
    { number: 4, title: 'AI Magic Auto-Configured', icon: Sparkles },
    { number: 5, title: 'AI System Template', icon: Settings },
  ];

  const canGoNext = () => {
    // All steps are optional - user can proceed anytime
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto py-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
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

            {/* Step 2: Your Products */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    <Package className="w-8 h-8 inline mr-2 text-purple-500" />
                    Your Products
                  </h2>
                  <p className="text-gray-600">Add at least 1 product to get started</p>
                </div>

                {loadingTemplate && products.length > 1 && (
                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200 mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-semibold text-green-900">
                        ✨ {products.length} Products Loaded from Millennium Soya Template!
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {products.map((product, index) => (
                    <div key={index} className="p-6 bg-purple-50 rounded-2xl border-2 border-purple-200 space-y-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-purple-900">Product {index + 1}</h3>
                        {index > 0 && (
                          <button
                            onClick={() => setProducts(products.filter((_, i) => i !== index))}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].name = e.target.value;
                            setProducts(newProducts);
                          }}
                          placeholder="C24/7 Natura-Ceuticals"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Short description *
                        </label>
                        <textarea
                          value={product.description}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].description = e.target.value;
                            setProducts(newProducts);
                          }}
                          placeholder="22,000+ nutrients in one capsule. Boosts immunity, energy, and overall health. ₱2,500/box"
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Product Image (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const newProducts = [...products];
                              newProducts[index].image = e.target.files?.[0] || null;
                              setProducts(newProducts);
                            }}
                            className="text-sm text-gray-600"
                          />
                          <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setProducts([...products, { name: '', description: '', image: null }])}
                    className="w-full py-3 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl text-purple-600 font-semibold transition-colors"
                  >
                    + Add Another Product
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
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
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Website Link
                    </label>
                    <input
                      type="url"
                      value={contactInfo.website}
                      onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: AI Magic Auto-Configured */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    <Sparkles className="w-8 h-8 inline mr-2 text-green-500" />
                    AI Magic Auto-Configured
                  </h2>
                  <p className="text-gray-600">We've set these up for you based on your industry</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 mb-1">✨ Automatically Configured</h3>
                      <p className="text-sm text-green-700">Based on "{industry}", we optimized these settings for you</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">Conversation Tone</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                          {autoSettings.tone === 'taglish' ? 'Taglish (Warm & Human)' : 'Professional'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {autoSettings.tone === 'taglish' 
                          ? 'Perfect for Filipino market - uses "po", casual mix of English/Tagalog' 
                          : 'Professional and friendly tone'}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Sales Chat Flow</div>
                      <div className="text-xs text-gray-600 whitespace-pre-line">
                        {autoSettings.chatFlow}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        Ready-to-Use Micro CTAs ({autoSettings.microCTAs.length})
                      </div>
                      <div className="space-y-1">
                        {autoSettings.microCTAs.slice(0, 3).map((cta, i) => (
                          <div key={i} className="text-xs text-gray-600 flex items-center gap-2">
                            <Check className="w-3 h-3 text-green-500" />
                            {cta}
                          </div>
                        ))}
                        {autoSettings.microCTAs.length > 3 && (
                          <div className="text-xs text-gray-500 italic">
                            ...and {autoSettings.microCTAs.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: AI System Template */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    <Settings className="w-8 h-8 inline mr-2 text-purple-500" />
                    AI System Template
                  </h2>
                  <p className="text-gray-600">
                    {aiInstructions ? 'Review and customize your AI' : 'Final review before activation'}
                  </p>
                </div>

                {aiInstructions ? (
                  <div className="space-y-4">
                    {/* Toggle Section */}
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-purple-900">
                              {companyName} AI System Instructions
                            </h3>
                            <p className="text-xs text-purple-700">
                              Pre-configured template with Taglish, sales flow, micro CTAs
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          onClick={() => setUseTemplateInstructions(!useTemplateInstructions)}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                            useTemplateInstructions ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                              useTemplateInstructions ? 'translate-x-8' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className={`transition-all ${useTemplateInstructions ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="bg-white rounded-xl p-4 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-semibold text-gray-700">
                              Template Preview ({editableInstructions.length.toLocaleString()} characters)
                            </div>
                            <button
                              onClick={() => setShowInstructionsModal(true)}
                              disabled={!useTemplateInstructions}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <Settings className="w-4 h-4" />
                              View & Edit
                            </button>
                          </div>
                          <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                            {editableInstructions.substring(0, 300)}...
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center text-xs">
                          <div className="p-3 bg-white rounded-lg">
                            <div className="font-bold text-purple-600">{products.length}</div>
                            <div className="text-gray-600">Products</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <div className="font-bold text-purple-600">{autoSettings.microCTAs.length}</div>
                            <div className="text-gray-600">Micro CTAs</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <div className="font-bold text-purple-600">Taglish</div>
                            <div className="text-gray-600">Filipino Ready</div>
                          </div>
                        </div>
                      </div>

                      {!useTemplateInstructions && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-xs text-yellow-800">
                            ⚠️ Template disabled. AI will use basic instructions from your form data.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-2xl">⚠️</div>
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 mb-1">
                          No Template Found
                        </p>
                        <p className="text-xs text-yellow-800">
                          Template loading failed or doesn't exist for "{companyMatch?.name || companyName}".
                          Your AI will use basic instructions.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-xs text-gray-600">
                      Debug Info:
                      <div>• Company: {companyName}</div>
                      <div>• Match: {matchedTemplate ? matchedTemplate.name : 'None'}</div>
                      <div>• Template loaded: {aiInstructions.length > 0 ? 'Yes ✅' : 'No ❌'}</div>
                      <div>• Instructions length: {aiInstructions.length.toLocaleString()} chars</div>
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
                    <textarea
                      value={editableInstructions}
                      onChange={(e) => setEditableInstructions(e.target.value)}
                      className="w-full h-full min-h-[400px] px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter AI system instructions..."
                    />
                    <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                      <span>{editableInstructions.length.toLocaleString()} characters</span>
                      <span>{Math.ceil(editableInstructions.length / 4)} tokens (approx)</span>
                    </div>
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
        {currentStep === 5 && (
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
  const taglishIndustries = ['mlm', 'MLM / Network Marketing', 'Health & Wellness'];
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
  };

  return ctas[industry] || ctas['mlm'];
}

