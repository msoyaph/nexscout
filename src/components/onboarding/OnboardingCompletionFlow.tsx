/**
 * Onboarding Completion Flow
 * Step 1: Connect Facebook Page (optional but recommended)
 * Step 2: Configure AI Chatbot (basic setup with smart defaults)
 */

import { useState, useEffect } from 'react';
import { Facebook, Sparkles, Upload, Globe, Check, ChevronRight, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AIConfigWizard from './AIConfigWizard';

interface OnboardingCompletionFlowProps {
  userId: string;
  userEmail: string;
  companyName: string;
  industry: string;
  companyMatch?: any | null;
  onComplete: () => void;
}

type Step = 'fb-connect' | 'ai-config' | 'done';

export default function OnboardingCompletionFlow({
  userId,
  userEmail,
  companyName,
  industry,
  companyMatch,
  onComplete
}: OnboardingCompletionFlowProps) {
  const [step, setStep] = useState<Step>('fb-connect');
  const [fbConnected, setFbConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // AI Config Form State
  const [companyDesc, setCompanyDesc] = useState('');
  const [products, setProducts] = useState([{ name: '', description: '', image: null as File | null }]);
  const [contactInfo, setContactInfo] = useState({ phone: '', email: userEmail, website: '' });
  const [aiInstructions, setAiInstructions] = useState('');
  
  // Auto-detected settings (background processing)
  const [autoSettings, setAutoSettings] = useState({
    tone: industry === 'MLM / Network Marketing' ? 'taglish' : 'professional',
    chatFlow: getDefaultChatFlow(industry),
    microCTAs: getDefaultMicroCTAs(industry),
  });

  useEffect(() => {
    checkFacebookConnection();
    loadTemplateData();
  }, [userId]);

  async function loadTemplateData() {
    try {
      setLoadingTemplate(true);
      
      // Check if user's company was seeded from admin template
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('admin_company_id, data_source')
        .eq('user_id', userId)
        .maybeSingle();

      if (companyProfile?.admin_company_id && companyProfile.data_source === 'admin_seed') {
        console.log('[OnboardingCompletion] Loading template data for company:', companyProfile.admin_company_id);
        
        // Load AI instructions from template
        const { data: knowledgePost } = await supabase
          .from('company_knowledge_posts')
          .select('content, title')
          .eq('admin_company_id', companyProfile.admin_company_id)
          .eq('post_type', 'ai_system_instructions')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (knowledgePost) {
          console.log('[OnboardingCompletion] ✨ Loaded AI instructions from template!');
          setAiInstructions(knowledgePost.content);
        }

        // Load products from template
        const { data: userProducts } = await supabase
          .from('products')
          .select('name, short_description')
          .eq('user_id', userId)
          .eq('data_source', 'admin_seed')
          .limit(3);

        if (userProducts && userProducts.length > 0) {
          console.log('[OnboardingCompletion] ✨ Loaded', userProducts.length, 'products from template!');
          setProducts(userProducts.map(p => ({
            name: p.name,
            description: p.short_description || '',
            image: null
          })));
        }
      }
    } catch (error) {
      console.error('[OnboardingCompletion] Error loading template data:', error);
    } finally {
      setLoadingTemplate(false);
    }
  }

  async function checkFacebookConnection() {
    const { data } = await supabase
      .from('facebook_page_connections')
      .select('page_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (data) {
      setFbConnected(true);
    }
  }

  function handleFacebookConnect() {
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!fbAppId) {
      alert('Facebook App ID is not configured. Please contact support.');
      return;
    }

    // Use Edge Function URL as redirect URI (not frontend route)
    // Normalize URL to ensure HTTPS and no double slashes
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    // Ensure HTTPS
    if (supabaseUrl.startsWith('http://')) {
      supabaseUrl = supabaseUrl.replace('http://', 'https://');
    } else if (!supabaseUrl.startsWith('https://')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }
    // Remove trailing slash to prevent double slashes
    supabaseUrl = supabaseUrl.replace(/\/+$/, '');
    const redirectUri = `${supabaseUrl}/functions/v1/facebook-oauth-callback`;
    const scopes = 'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement';
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${userId}`;
    
    console.log('[Facebook OAuth] Starting OAuth flow:', {
      appId: fbAppId,
      redirectUri,
      userId
    });
    
    window.location.href = authUrl;
  }

  async function handleSaveAIConfig() {
    setSaving(true);
    try {
      console.log('[OnboardingCompletion] Saving AI config...');
      
      // Use template AI instructions if available, otherwise build from form
      const finalInstructions = aiInstructions || buildSystemInstructions();
      
      // Save chatbot settings (this table exists!)
      const { error: chatbotError } = await supabase
        .from('chatbot_settings')
        .upsert({
          user_id: userId,
          tone: autoSettings.tone,
          is_configured: true,
          custom_instructions: finalInstructions, // Use custom_instructions column
        });

      if (chatbotError) {
        console.error('[OnboardingCompletion] Chatbot settings error:', chatbotError);
        throw new Error('Failed to save chatbot settings: ' + chatbotError.message);
      }

      console.log('[OnboardingCompletion] ✅ AI chatbot configured!');
      
      // Mark onboarding complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId);

      if (profileError) {
        console.error('[OnboardingCompletion] Profile error:', profileError);
        throw new Error('Failed to mark onboarding complete');
      }

      console.log('[OnboardingCompletion] ✅ Onboarding marked complete!');
      
      // Navigate to dashboard
      onComplete();
    } catch (error: any) {
      console.error('[OnboardingCompletion] Error:', error);
      alert('Error: ' + error.message + '\n\nPlease try Skip for Now.');
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

**Conversation Flow:**
${autoSettings.chatFlow}

**Tone:** ${autoSettings.tone === 'taglish' ? 'Warm, friendly, light Taglish. Human warmth.' : 'Professional but friendly.'}

**Micro CTAs:**
${autoSettings.microCTAs.join('\n')}

**Always:**
- Be clear & short
- Focus on solving their needs
- Stay supportive, never pushy
- Offer help immediately
`;
  }

  // ========== STEP 1: Facebook Connection ==========
  if (step === 'fb-connect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-2">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-3 md:p-5">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🎉 Get Your First Big Win!</h1>
            <p className="text-sm text-gray-600">Connect your Facebook Page and start capturing leads in minutes</p>
          </div>

          {/* FB Connect Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Connect Facebook Messenger</h3>
                <p className="text-sm text-gray-700">
                  Your AI will automatically respond to Messenger chats, qualify leads, and book appointments while you sleep 💤
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">✨ <strong>What happens after you connect:</strong></p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>✅ AI replies to all Messenger inquiries instantly</li>
                <li>✅ Qualifies leads and detects buying signals</li>
                <li>✅ Books appointments automatically</li>
                <li>✅ Works 24/7 in Taglish (perfect for Filipino market)</li>
              </ul>
            </div>

            {fbConnected ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <Check className="w-6 h-6 text-green-600" />
                <span className="text-green-900 font-semibold">Facebook Page Connected! ✅</span>
              </div>
            ) : (
              <button
                onClick={handleFacebookConnect}
                disabled={userEmail !== 'geoffmax22@gmail.com'}
                className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                  userEmail === 'geoffmax22@gmail.com'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl cursor-pointer'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-75'
                }`}
                title={userEmail !== 'geoffmax22@gmail.com' ? 'This feature is currently in development' : 'Connect your Facebook page'}
              >
                <Facebook className="w-5 h-5" />
                Connect Facebook Page Now
              </button>
            )}
          </div>

          {/* Skip/Continue Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('ai-config')}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              {fbConnected ? 'Continue Setup' : 'Skip for Now'}
            </button>
            {fbConnected && (
              <button
                onClick={() => setStep('ai-config')}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== STEP 2: AI Configuration ==========
  if (step === 'ai-config') {
    return <AIConfigWizard
      userId={userId}
      userEmail={userEmail}
      companyName={companyName}
      industry={industry}
      companyMatch={companyMatch}
      onComplete={onComplete}
      onSkip={onComplete}
    />;
  }

  // OLD VERSION (KEEP AS BACKUP FOR NOW):
  if (step === 'ai-config-old') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Run Your AI-Powered Sales Chatbot</h1>
              <p className="text-gray-600">Like a pro now — as easy as giving it commands</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Company Section */}
              <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏢</span>
                  1. Company Information
                </h3>
                
                <div className="space-y-4">
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
                    <p className="text-xs text-gray-500 mt-1">✅ Pre-populated from signup</p>
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
                    <p className="text-xs text-gray-500 mt-1">✅ From your wizard selection</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Short description about your company
                    </label>
                    <textarea
                      value={companyDesc}
                      onChange={(e) => setCompanyDesc(e.target.value)}
                      placeholder="We help Filipinos achieve financial freedom through health and wellness products..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="p-6 bg-purple-50 rounded-2xl border-2 border-purple-200">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  2. Your Products (Add at least 1)
                </h3>

                {products.map((product, index) => (
                  <div key={index} className="mb-4 p-4 bg-white rounded-xl border-2 border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Product Name
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
                          Short description
                        </label>
                        <textarea
                          value={product.description}
                          onChange={(e) => {
                            const newProducts = [...products];
                            newProducts[index].description = e.target.value;
                            setProducts(newProducts);
                          }}
                          placeholder="22,000+ nutrients in one capsule. Boosts immunity, energy, and overall health. ₱2,500/box"
                          rows={2}
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
                  </div>
                ))}

                <button
                  onClick={() => setProducts([...products, { name: '', description: '', image: null }])}
                  className="w-full py-3 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl text-purple-600 font-semibold transition-colors"
                >
                  + Add Another Product
                </button>
              </div>

              {/* Contact Info Section */}
              <div className="p-6 bg-pink-50 rounded-2xl border-2 border-pink-200">
                <h3 className="font-bold text-pink-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📞</span>
                  3. Contact Information
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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

              {/* Auto-Config Preview */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">✨ AI Magic Auto-Configured</h3>
                    <p className="text-sm text-green-700">Based on your industry, we set these for you:</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tone:</span>
                    <span className="font-semibold text-gray-900">{autoSettings.tone === 'taglish' ? 'Taglish (Warm & Human)' : 'Professional'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chat Flow:</span>
                    <span className="font-semibold text-gray-900">Optimized for {industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Micro CTAs:</span>
                    <span className="font-semibold text-gray-900">{autoSettings.microCTAs.length} ready-to-use</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">You can customize these anytime in Settings</p>
                </div>
              </div>

              {/* Action Buttons */}
              {/* Show template indicator if AI instructions loaded */}
              {aiInstructions && (
                <div className="mb-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-semibold text-green-900">
                      ✨ AI Instructions Loaded from Millennium Soya Template!
                    </p>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    {aiInstructions.substring(0, 100)}... ({aiInstructions.length} characters loaded)
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    // Skip AI config, just mark complete
                    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
                    onComplete();
                  }}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleSaveAIConfig}
                  disabled={saving}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Activate My AI Chatbot
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ========== Helper Functions ==========

function getDefaultChatFlow(industry: string): string {
  const flows: Record<string, string> = {
    'MLM / Network Marketing': `1. Warm greeting (Taglish OK!)
2. Ask needs: "Health or income po kayo?"
3. Recommend correct package
4. Share benefits clearly (social proof, income slides)
5. Soft CTA: "Ready to order?" or "Join our team?"
6. Offer COD & payment options
7. Stay supportive, never pushy`,
    
    'Insurance': `1. Friendly greeting
2. Ask about protection needs
3. Explain coverage options
4. Share benefits and testimonials
5. Book consultation call
6. Follow up with quotes`,
    
    'Real Estate': `1. Warm welcome
2. Ask about property needs
3. Share available listings
4. Schedule property viewing
5. Answer questions
6. Book appointment`,
    
    'Online Seller': `1. Greet customer
2. Show product catalog
3. Answer product questions
4. Share pricing and promos
5. Process order
6. Provide tracking info`,
    
    'Coaching / Consulting': `1. Professional greeting
2. Ask about goals/challenges
3. Explain services
4. Share success stories
5. Book discovery call
6. Send follow-up resources`,
    
    'Service Provider': `1. Friendly greeting
2. Ask about service needs
3. Explain offerings
4. Share portfolio/testimonials
5. Book consultation
6. Send quote`,
  };

  return flows[industry] || flows['Online Seller'];
}

function getDefaultMicroCTAs(industry: string): string[] {
  const ctas: Record<string, string[]> = {
    'MLM / Network Marketing': [
      '"Ready po to order? COD available."',
      '"Gusto n\'yo po ba makita earning slides?"',
      '"Pwede ko po kayo i-book quick call, 10 mins lang 😊"',
      '"Health or income muna po tayo?"',
      '"May promo kami ngayon — interested ka?"',
      '"Join our team! May training and support kami."',
    ],
    
    'Insurance': [
      '"Would you like a free coverage review?"',
      '"Ready to secure your family\'s future?"',
      '"Let\'s schedule a quick 15-min call?"',
    ],
    
    'Real Estate': [
      '"Want to schedule a property viewing?"',
      '"I can send you the floor plans!"',
      '"Ready to reserve your unit?"',
    ],
    
    'Online Seller': [
      '"Ready to checkout?"',
      '"May promo kami ngayon!"',
      '"COD available po!"',
    ],
    
    'Coaching / Consulting': [
      '"Book a free discovery call?"',
      '"Want to see our success stories?"',
      '"Ready to start your transformation?"',
    ],
    
    'Service Provider': [
      '"Need a free quote?"',
      '"Schedule a consultation?"',
      '"Check out our portfolio?"',
    ],
  };

  return ctas[industry] || ctas['Online Seller'];
}

