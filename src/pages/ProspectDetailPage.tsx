import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Flame, MessageCircle, FileText, TrendingUp, Sparkles, Lock, Plus, Bell, MoreHorizontal, Trash2, Phone, Mail, MessageSquare, X, User, Globe, Clock, Edit2, Check, Loader2, Facebook, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ProspectWithScore } from '../lib/types/scanning';
import GenerateMessageModal from '../components/GenerateMessageModal';
import GenerateSequenceModal from '../components/GenerateSequenceModal';
import GenerateDeckModal from '../components/GenerateDeckModal';
import ProspectPhotoUpload from '../components/ProspectPhotoUpload';
import ProspectAvatar from '../components/ProspectAvatar';
import ProUpgradeModal from '../components/ProUpgradeModal';
import SetReminderModal from '../components/SetReminderModal';
import ManageProspectModal from '../components/ManageProspectModal';
import { ScoutScoreDebugPanel } from '../components/debug';
import { supabase } from '../lib/supabase';
import { useAutomation } from '../hooks/useAutomation';
import AutomationPreviewModal from '../components/automation/AutomationPreviewModal';
import AutomationProgressModal from '../components/automation/AutomationProgressModal';
import SmartRecommendationCard from '../components/automation/SmartRecommendationCard';
import { AUTOMATION_COSTS } from '../config/automationCosts';

interface ProspectDetailPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
  prospect?: ProspectWithScore;
  prospectId?: string;
}

export default function ProspectDetailPage({ onBack, onNavigate, prospect: initialProspect, prospectId }: ProspectDetailPageProps) {
  const { user, profile } = useAuth();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [prospect, setProspect] = useState<any>(initialProspect);
  const [loading, setLoading] = useState(!initialProspect && !!prospectId);
  const [error, setError] = useState<string | null>(null);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [regeneratingScore, setRegeneratingScore] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'sequence' | 'deck' | 'deepscan' | 'automation'>('sequence');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [latestSession, setLatestSession] = useState<any>(null);
  const [isEditingVisitorInfo, setIsEditingVisitorInfo] = useState(false);
  const [editVisitorName, setEditVisitorName] = useState('');
  const [editVisitorEmail, setEditVisitorEmail] = useState('');
  const [editVisitorPhone, setEditVisitorPhone] = useState('');
  const [editPersonalNote, setEditPersonalNote] = useState('');
  const [savingVisitorInfo, setSavingVisitorInfo] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  
  // Premium automation features
  const automation = useAutomation(
    prospectId || initialProspect?.id || '',
    initialProspect?.full_name || prospect?.full_name || 'Prospect'
  );

  useEffect(() => {
    if (prospectId && !initialProspect) {
      loadProspect();
    } else if (initialProspect) {
      // Ensure initialProspect has pipeline_stage
      setProspect({
        ...initialProspect,
        pipeline_stage: initialProspect.pipeline_stage || null
      });
    }
  }, [prospectId]);

  // Refresh prospect pipeline status when component becomes visible (e.g., navigating back)
  useEffect(() => {
    if (prospectId && user && prospect?.id) {
      const refreshPipelineStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('prospects')
            .select('pipeline_stage')
            .eq('id', prospectId)
            .maybeSingle();
          
          if (error) {
            console.error('[ProspectDetail] Error refreshing pipeline status:', error);
            return;
          }
          
          if (data) {
            setProspect((prev: any) => ({
              ...prev,
              pipeline_stage: data.pipeline_stage
            }));
          }
        } catch (error) {
          console.error('[ProspectDetail] Unexpected error refreshing pipeline status:', error);
        }
      };
      
      // Only refresh if we have a prospect loaded
      if (prospect?.id) {
        refreshPipelineStatus();
      }
    }
  }, [prospectId, user]);

  async function loadLatestSession(prospectData?: any) {
    const targetProspect = prospectData || prospect;
    if (!targetProspect?.id || !user?.id) return;
    
    try {
      // Try to find session by matching visitor contact info
      const nameValue = targetProspect?.full_name?.trim();
      const emailValue = (targetProspect?.email || targetProspect?.metadata?.email)?.trim();
      const phoneValue = (targetProspect?.phone || targetProspect?.metadata?.phone)?.trim();

      let session = null;

      // Priority 1: Try by exact name match
      if (nameValue) {
        const { data: sessionByName } = await supabase
          .from('public_chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('visitor_name', nameValue)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionByName) {
          // Verify match with email/phone if available
          const matches = 
            (!emailValue || !sessionByName.visitor_email || sessionByName.visitor_email === emailValue) &&
            (!phoneValue || !sessionByName.visitor_phone || sessionByName.visitor_phone === phoneValue);
          
          if (matches) {
            session = sessionByName;
          }
        }
      }

      // Priority 2: Try by email if no name match
      if (!session && emailValue) {
        const { data: sessionByEmail } = await supabase
          .from('public_chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('visitor_email', emailValue)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionByEmail) {
          session = sessionByEmail;
        }
      }

      // Priority 3: Try by phone if still no match
      if (!session && phoneValue) {
        const { data: sessionByPhone } = await supabase
          .from('public_chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('visitor_phone', phoneValue)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionByPhone) {
          session = sessionByPhone;
        }
      }

      setLatestSession(session || null);
    } catch (error) {
      console.error('Error loading latest session:', error);
      setLatestSession(null);
    }
  }

  async function loadProspect() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .maybeSingle();

      if (error) {
        console.error('[ProspectDetail] Error loading prospect:', error);
        setError('Failed to load prospect. Please try again.');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Prospect not found.');
        setLoading(false);
        return;
      }

      if (data) {
        setProspect({
          id: data.id,
          full_name: data.full_name,
          username: data.username || '',
          platform: data.platform,
          profile_link: data.profile_link,
          bio_text: data.bio_text,
          profile_image_url: data.profile_image_url,
          uploaded_image_url: data.uploaded_image_url,
          social_image_url: data.social_image_url,
          avatar_seed: data.avatar_seed,
          location: data.location,
          occupation: data.occupation,
          is_unlocked: data.is_unlocked,
          pipeline_stage: data.pipeline_stage,
          metadata: data.metadata,
          score: {
            scout_score: data.metadata?.scout_score || 50,
            bucket: data.metadata?.bucket || 'warm',
            explanation_tags: data.metadata?.explanation_tags || [
              'Active social media presence',
              'Engaged with entrepreneurial content',
              'Shows leadership qualities'
            ],
            engagement_score: data.metadata?.engagement_score || 0.75,
            responsiveness_likelihood: data.metadata?.responsiveness_likelihood || 0.68,
            mlm_leadership_potential: data.metadata?.mlm_leadership_potential || 0.82,
          },
          profile: {
            dominant_topics: data.metadata?.dominant_topics || data.metadata?.tags || ['Business', 'Networking', 'Growth'],
            pain_points: data.metadata?.pain_points || ['Looking for additional income', 'Career growth opportunities'],
            life_events: data.metadata?.life_events || [],
          },
          email: data.email || data.metadata?.email,
          phone: data.phone || data.metadata?.phone,
        });
        
        // Load latest session after prospect is set
        await loadLatestSession({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          metadata: data.metadata,
        });
      }
    } catch (error) {
      console.error('Error loading prospect:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (prospect?.id && user?.id && !latestSession) {
      loadLatestSession();
    }
  }, [prospect?.id, user?.id]);

  // FAB: Handle click outside and ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabExpanded && fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setFabExpanded(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fabExpanded) {
        setFabExpanded(false);
      }
    };

    if (fabExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when backdrop is active
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [fabExpanded]);

  // FAB: Handler functions
  const handleFabCall = () => {
    const phoneNumber = prospect?.phone || prospect?.metadata?.phone || latestSession?.visitor_phone;
    if (phoneNumber && String(phoneNumber).trim().length > 0) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      alert('No phone number available for this prospect.');
    }
    setFabExpanded(false);
  };

  const handleFabSMS = () => {
    const phoneNumber = prospect?.phone || prospect?.metadata?.phone || latestSession?.visitor_phone;
    if (phoneNumber && String(phoneNumber).trim().length > 0) {
      window.location.href = `sms:${phoneNumber}`;
    } else {
      alert('No phone number available for this prospect.');
    }
    setFabExpanded(false);
  };

  const handleFabMessenger = async () => {
    if (!prospect?.id || !user?.id) {
      alert('Unable to find prospect or user information.');
      setFabExpanded(false);
      return;
    }

    try {
      console.log('[AI Chat] Looking for session for prospect:', {
        prospectId: prospect.id,
        prospectName: prospect?.full_name,
        prospectEmail: prospect?.email,
        prospectPhone: prospect?.phone
      });

      // Try to find existing session by visitor contact info
      let existingSession = null;
      // Be strict: prioritize exact name match first, then email, then phone
      const nameValue = prospect?.full_name?.trim();
      const emailValue = (prospect?.email || prospect?.metadata?.email)?.trim();
      const phoneValue = (prospect?.phone || prospect?.metadata?.phone)?.trim();

      // Priority 1: Exact name match (most reliable for identifying the right person)
      if (nameValue) {
        const { data: sessionByName } = await supabase
          .from('public_chat_sessions')
          .select('id, visitor_name, visitor_email, visitor_phone')
          .eq('user_id', user.id)
          .eq('visitor_name', nameValue)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionByName?.id) {
          // Verify this session is actually for this prospect (double-check)
          const sessionMatches = 
            (!emailValue || !sessionByName.visitor_email || sessionByName.visitor_email === emailValue) &&
            (!phoneValue || !sessionByName.visitor_phone || sessionByName.visitor_phone === phoneValue);

          if (sessionMatches) {
            console.log('[AI Chat] Found session by exact name match:', sessionByName.id);
            existingSession = sessionByName;
          }
        }
      }

      // Priority 2: If no name match, try email (only if we have both prospect email and no name match)
      if (!existingSession && emailValue) {
        const { data: sessionByEmail } = await supabase
          .from('public_chat_sessions')
          .select('id, visitor_name, visitor_email, visitor_phone')
          .eq('user_id', user.id)
          .eq('visitor_email', emailValue)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionByEmail?.id) {
          // Verify: if prospect has a name, session should have matching name (or be null)
          const sessionMatches = 
            (!nameValue || !sessionByEmail.visitor_name || sessionByEmail.visitor_name === nameValue) &&
            (!phoneValue || !sessionByEmail.visitor_phone || sessionByEmail.visitor_phone === phoneValue);

          if (sessionMatches) {
            console.log('[AI Chat] Found session by email match:', sessionByEmail.id);
            existingSession = sessionByEmail;
          }
        }
      }

      // Priority 3: If still no match, try phone (only as last resort)
      if (!existingSession && phoneValue) {
        const { data: sessionByPhone } = await supabase
          .from('public_chat_sessions')
          .select('id, visitor_name, visitor_email, visitor_phone')
          .eq('user_id', user.id)
          .eq('visitor_phone', phoneValue)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionByPhone?.id) {
          // Verify: match name and email if available
          const sessionMatches = 
            (!nameValue || !sessionByPhone.visitor_name || sessionByPhone.visitor_name === nameValue) &&
            (!emailValue || !sessionByPhone.visitor_email || sessionByPhone.visitor_email === emailValue);

          if (sessionMatches) {
            console.log('[AI Chat] Found session by phone match:', sessionByPhone.id);
            existingSession = sessionByPhone;
          }
        }
      }

      if (existingSession?.id) {
        console.log('[AI Chat] Navigating to session:', existingSession.id);
        onNavigate?.('chatbot-session-viewer', { sessionId: existingSession.id });
        setFabExpanded(false);
        return;
      }

      // No existing session found - create a new one
      // Get chatbot_id from user's profile or chatbot_links
      let chatbotId = '';
      
      // Try to get from chatbot_links first
      const { data: chatbotLink } = await supabase
        .from('chatbot_links')
        .select('chatbot_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (chatbotLink?.chatbot_id) {
        chatbotId = chatbotLink.chatbot_id;
      } else {
        // Fallback to unique_user_id from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('unique_user_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData?.unique_user_id) {
          chatbotId = profileData.unique_user_id;
        }
      }

      // If still no chatbot_id, use a default format based on user ID
      if (!chatbotId) {
        chatbotId = `prospect_chat_${user.id.slice(0, 8)}`;
      }

      console.log('[AI Chat] Creating new session with chatbot_id:', chatbotId);

      // Generate visitor_session_id for this prospect
      const visitorSessionId = `prospect_${prospect.id}_${Date.now()}`;
      
      // Create new session with prospect info
      const sessionSlug = `prospect_${prospect.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const sessionData: any = {
        user_id: user.id,
        chatbot_id: chatbotId,
        visitor_session_id: visitorSessionId,
        session_slug: sessionSlug,
        channel: 'web',
        status: 'active',
        buying_intent_score: 0,
        qualification_score: 0,
        message_count: 0
      };

      // Add visitor info if available
      if (prospect.full_name) {
        sessionData.visitor_name = prospect.full_name;
      }
      if (prospect.email) {
        sessionData.visitor_email = prospect.email;
      }
      if (prospect.phone) {
        sessionData.visitor_phone = prospect.phone;
      }
      
      console.log('[AI Chat] Session data:', sessionData);
      
      const { data: newSession, error: createError } = await supabase
        .from('public_chat_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (createError) {
        console.error('[AI Chat] Error creating chat session:', createError);
        console.error('[AI Chat] Error details:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        });
        alert(`Unable to create chat session: ${createError.message || 'Please try again.'}`);
        setFabExpanded(false);
        return;
      }

      if (newSession?.id) {
        console.log('[AI Chat] Successfully created session:', newSession.id);
        onNavigate?.('chatbot-session-viewer', { sessionId: newSession.id });
      } else {
        console.error('[AI Chat] No session ID returned from insert');
        alert('Unable to create chat session. Please try again.');
      }
    } catch (error) {
      console.error('Error handling AI Chat:', error);
      alert('Unable to open chat session. Please try again.');
    }
    setFabExpanded(false);
  };

  // Initialize edit form fields when session or prospect changes
  useEffect(() => {
    if (latestSession) {
      setEditVisitorName(latestSession.visitor_name || prospect?.full_name || '');
      setEditVisitorEmail(latestSession.visitor_email || prospect?.email || '');
      setEditVisitorPhone(latestSession.visitor_phone || prospect?.phone || '');
      let personalNote = '';
      if (latestSession.conversation_context) {
        const context = typeof latestSession.conversation_context === 'string'
          ? JSON.parse(latestSession.conversation_context)
          : latestSession.conversation_context;
        personalNote = context?.personal_note || '';
      }
      setEditPersonalNote(personalNote);
    } else if (prospect) {
      setEditVisitorName(prospect.full_name || '');
      setEditVisitorEmail(prospect.email || '');
      setEditVisitorPhone(prospect.phone || '');
      setEditPersonalNote('');
    }
  }, [latestSession, prospect]);

  async function handleRegenerateScore() {
    if (!prospect?.id || regeneratingScore) return;
    
    const coinCost = 2;
    const currentCoins = profile?.coin_balance || 0;
    
    if (currentCoins < coinCost) {
      alert(`❌ Insufficient coins!\n\nYou need ${coinCost} coins but have ${currentCoins}.\n\nBuy more coins or upgrade to Pro for monthly bonuses!`);
      return;
    }
    
    if (!confirm(`🔄 Regenerate ScoutScore Analysis?\n\nCost: ${coinCost} coins\n\nThis will analyze the latest chat conversation and update the score with fresh AI insights.`)) {
      return;
    }
    
    setRegeneratingScore(true);
    try {
      // Deduct coins
      const { error: coinError } = await supabase
        .from('profiles')
        .update({ coin_balance: currentCoins - coinCost })
        .eq('id', user?.id);
      
      if (coinError) throw coinError;
      
      // Regenerate score
      const { data, error } = await supabase.rpc('regenerate_prospect_scoutscore', {
        p_prospect_id: prospect.id
      });
      
      if (error) throw error;
      
      if (data?.success) {
        alert(`✅ ScoutScore Updated!\n\nNew Score: ${data.scout_score}/100\nBucket: ${data.bucket.toUpperCase()}\n\n${coinCost} coins deducted.`);
        await loadProspect();
      }
    } catch (error: any) {
      console.error('Error regenerating score:', error);
      
      // Refund coins
      await supabase.from('profiles').update({ coin_balance: currentCoins }).eq('id', user?.id);
      
      alert('❌ Failed to regenerate score.\n\nYour coins have been refunded.');
    } finally {
      setRegeneratingScore(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading prospect...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="inline-block size-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="size-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Prospect</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                if (prospectId) {
                  loadProspect();
                } else {
                  onBack();
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {prospectId ? 'Retry' : 'Go Back'}
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Prospect not found</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const canAccessFeature = (feature: 'sequence' | 'deck' | 'deepscan') => {
    // All Pro features (Elite tier removed)
    return profile?.subscription_tier === 'pro';

  // Contact menu handlers
  const handleCall = () => {
    const phoneNumber = prospect?.phone || prospect?.metadata?.phone || prospect?.contact_phone || prospect?.metadata?.contact_phone;
    if (phoneNumber && String(phoneNumber).trim().length > 0) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      alert('No phone number available for this prospect.');
    }
    setShowContactMenu(false);
  };

  const handleMessage = async () => {
    if (!prospect?.id || !user?.id) {
      alert('Unable to find prospect or user information.');
      setShowContactMenu(false);
      return;
    }

    try {
      // Find chatbot session for this prospect
      const phoneValue = prospect?.phone || prospect?.metadata?.phone || prospect?.contact_phone || prospect?.metadata?.contact_phone;
      const emailValue = prospect?.email || prospect?.metadata?.email || prospect?.contact_email || prospect?.metadata?.contact_email;
      
      const { data: session } = await supabase
        .from('public_chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .or(`visitor_name.eq.${prospect.full_name || ''},visitor_email.eq.${emailValue || ''},visitor_phone.eq.${phoneValue || ''}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session?.id) {
        onNavigate?.('chatbot-session-viewer', { sessionId: session.id });
      } else {
        alert('No chat session found for this prospect. Start a new conversation from the chatbot sessions page.');
      }
    } catch (error) {
      console.error('Error finding chat session:', error);
      alert('Unable to find chat session. Please try again.');
    }
    setShowContactMenu(false);
  };

  const handleEmail = () => {
    const email = prospect?.email || prospect?.metadata?.email || prospect?.contact_email || prospect?.metadata?.contact_email;
    if (email && String(email).trim().length > 0) {
      window.location.href = `mailto:${email}`;
    } else {
      alert('No email address available for this prospect.');
    }
    setShowContactMenu(false);
  };

  // Get contact data availability - check multiple possible locations and filter out empty strings
  const phoneValue = prospect?.phone || prospect?.metadata?.phone || prospect?.contact_phone || prospect?.metadata?.contact_phone;
  const hasPhone = !!(phoneValue && String(phoneValue).trim().length > 0);
  
  const emailValue = prospect?.email || prospect?.metadata?.email || prospect?.contact_email || prospect?.metadata?.contact_email;
  const hasEmail = !!(emailValue && String(emailValue).trim().length > 0);

  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center size-9 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
            >
              <ArrowLeft className="size-4" />
            </button>

            <button
              onClick={() => setShowPhotoUpload(true)}
              className="relative group flex-shrink-0"
              title="Manage photo"
            >
              <ProspectAvatar prospect={prospect} size="md" />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{prospect.full_name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs font-medium">
                  {prospect.platform}
                </span>
                {prospect.is_unlocked && (
                  <span className="px-2 py-0.5 bg-green-500/20 backdrop-blur rounded-full text-xs font-medium flex items-center gap-1">
                    <svg className="size-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Unlocked
                  </span>
                )}
              </div>
            </div>
            
            {/* 3 Dots Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center size-9 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
              >
                <MoreHorizontal className="size-5" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-30 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1">
                    <button
                      onClick={() => {
                        setShowManageModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Manage Prospect
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100">
          {/* Header with Regenerate Button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600 uppercase">ScoutScore</h2>
            <button
              onClick={handleRegenerateScore}
              disabled={regeneratingScore}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-xs font-semibold text-blue-600 disabled:opacity-50 shadow-sm"
              title="Regenerate ScoutScore from latest conversation (2 coins)"
            >
              {regeneratingScore ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Regenerate</span>
                  <span className="text-[10px] bg-blue-100 px-1.5 py-0.5 rounded ml-1">2 coins</span>
                </>
              )}
            </button>
          </div>
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <svg className="size-32" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(prospect.score?.scout_score || 0) * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1877F2" />
                    <stop offset="100%" stopColor="#1EC8FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{prospect.score?.scout_score || 0}</span>
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-block px-6 py-2 rounded-full font-bold text-white ${
                prospect.score?.bucket === 'hot'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : prospect.score?.bucket === 'warm'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}>
                {prospect.score?.bucket?.toUpperCase() || 'UNKNOWN'} LEAD
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Sparkles className="size-4 text-[#1877F2]" />
                Why This Score?
              </h3>
              <button
                onClick={() => setShowDebugPanel(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1877F2] hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 bg-white"
                title="View detailed ScoutScore breakdown (v1-v8)"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Debug View
              </button>
            </div>
            <div className="space-y-2">
              {(prospect.score?.explanation_tags || []).map((tag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="size-1.5 rounded-full bg-[#1877F2] mt-2 flex-shrink-0" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visitor Info - Compact */}
        {(latestSession || prospect?.email || prospect?.phone || prospect?.full_name) && (
          <section className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#1877F2]" />
                Visitor Info
              </h3>
              <div className="flex items-center gap-2">
                {!isEditingVisitorInfo && (
                  <button
                    onClick={() => setIsEditingVisitorInfo(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1877F2] hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Info
                  </button>
                )}
              </div>
            </div>

            {isEditingVisitorInfo ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={editVisitorName}
                    onChange={(e) => setEditVisitorName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter name"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editVisitorEmail}
                    onChange={(e) => setEditVisitorEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={editVisitorPhone}
                    onChange={(e) => setEditVisitorPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Personal Note</label>
                  <textarea
                    value={editPersonalNote}
                    onChange={(e) => setEditPersonalNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Add a personal note..."
                  />
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={async () => {
                      setSavingVisitorInfo(true);
                      try {
                        // Update prospect
                        const prospectUpdate: any = {
                          full_name: editVisitorName.trim() || null,
                          email: editVisitorEmail.trim() || null,
                          phone: editVisitorPhone.trim() || null,
                          metadata: {
                            ...(prospect.metadata || {}),
                            notes: editPersonalNote.trim() || null,
                          }
                        };

                        const { error: prospectError } = await supabase
                          .from('prospects')
                          .update(prospectUpdate)
                          .eq('id', prospect.id);

                        if (prospectError) throw prospectError;

                        // Update session if exists
                        if (latestSession?.id) {
                          const sessionUpdate: any = {
                            visitor_name: editVisitorName.trim() || null,
                            visitor_email: editVisitorEmail.trim() || null,
                            visitor_phone: editVisitorPhone.trim() || null,
                            updated_at: new Date().toISOString()
                          };

                          if (latestSession.conversation_context) {
                            const currentContext = typeof latestSession.conversation_context === 'string'
                              ? JSON.parse(latestSession.conversation_context)
                              : latestSession.conversation_context;
                            sessionUpdate.conversation_context = {
                              ...currentContext,
                              personal_note: editPersonalNote.trim() || null
                            };
                          } else if (editPersonalNote.trim()) {
                            sessionUpdate.conversation_context = {
                              personal_note: editPersonalNote.trim()
                            };
                          }

                          const { error: sessionError } = await supabase
                            .from('public_chat_sessions')
                            .update(sessionUpdate)
                            .eq('id', latestSession.id);

                          if (sessionError) throw sessionError;
                        }

                        // Reload data
                        await loadProspect();
                        if (latestSession?.id) {
                          await loadLatestSession();
                        }
                        
                        setIsEditingVisitorInfo(false);
                        
                        // Trigger onProspectUpdated if ManageProspectModal is listening
                        if (onNavigate) {
                          // This will refresh the modal if open
                        }
                        
                        alert('✅ Visitor info saved successfully!');
                      } catch (error) {
                        console.error('Error saving visitor info:', error);
                        alert('Failed to save visitor info. Please try again.');
                      } finally {
                        setSavingVisitorInfo(false);
                      }
                    }}
                    disabled={savingVisitorInfo}
                    className="flex-1 px-4 py-2 bg-[#1877F2] text-white text-sm font-semibold rounded-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingVisitorInfo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingVisitorInfo(false);
                      // Reset to original values
                      setEditVisitorName(latestSession?.visitor_name || prospect?.full_name || '');
                      setEditVisitorEmail(latestSession?.visitor_email || prospect?.email || '');
                      setEditVisitorPhone(latestSession?.visitor_phone || prospect?.phone || '');
                      let personalNote = '';
                      if (latestSession?.conversation_context) {
                        const context = typeof latestSession.conversation_context === 'string'
                          ? JSON.parse(latestSession.conversation_context)
                          : latestSession.conversation_context;
                        personalNote = context?.personal_note || '';
                      }
                      setEditPersonalNote(personalNote);
                    }}
                    disabled={savingVisitorInfo}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-[14px]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 font-semibold min-w-[50px]">Name:</span>
                  <span className="text-gray-900 font-bold truncate">{latestSession?.visitor_name || prospect?.full_name || 'Not provided'}</span>
                </div>
                {(latestSession?.visitor_email || prospect?.email) && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-semibold min-w-[50px]">Email:</span>
                    <span className="text-[#1877F2] font-bold truncate">{latestSession?.visitor_email || prospect?.email || 'Not provided'}</span>
                  </div>
                )}
                {(latestSession?.visitor_phone || prospect?.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 font-semibold min-w-[50px]">Phone:</span>
                    <span className="text-gray-900 font-bold truncate">{latestSession?.visitor_phone || prospect?.phone || 'Not provided'}</span>
                  </div>
                )}
                {(() => {
                  let personalNote = '';
                  // Check session conversation_context first
                  if (latestSession?.conversation_context) {
                    const context = typeof latestSession.conversation_context === 'string'
                      ? JSON.parse(latestSession.conversation_context)
                      : latestSession.conversation_context;
                    personalNote = context?.personal_note || '';
                  }
                  // Fallback to prospect notes if no session note
                  if (!personalNote && prospect?.metadata?.notes) {
                    personalNote = prospect.metadata.notes;
                  }
                  if (!personalNote && prospect?.bio_text) {
                    personalNote = prospect.bio_text;
                  }
                  
                  return (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 font-semibold min-w-[50px]">Note:</span>
                      <span className="text-gray-900 flex-1 line-clamp-2">{personalNote || 'No note added'}</span>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
                  <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 font-semibold">Channel:</span>
                  <span className="text-gray-900 font-bold capitalize">{latestSession?.channel || 'Web'}</span>
                  {latestSession?.updated_at && (
                    <>
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0 ml-1" />
                      <span className="text-gray-500 text-xs">
                        AI Analyzed {new Date(latestSession.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-[#1877F2] mb-1">
              {Math.round((prospect.score?.engagement_score || 0) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Engagement</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-[#1EC8FF] mb-1">
              {Math.round((prospect.score?.responsiveness_likelihood || 0) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Response Rate</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.round((prospect.score?.mlm_leadership_potential || 0) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Leadership</div>
          </div>
        </section>

        {prospect.profile?.dominant_topics && prospect.profile.dominant_topics.length > 0 && (
          <section className="bg-white rounded-3xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-[#1877F2]" />
              Interests & Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {prospect.profile.dominant_topics.map((topic, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-full text-sm font-medium text-gray-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Smart Recommendation Card - PREMIUM FEATURE */}
        {automation.recommendation && (
          <SmartRecommendationCard
            recommendation={automation.recommendation}
            onRunAction={automation.runRecommended}
          />
        )}

        {prospect.profile?.pain_points && prospect.profile.pain_points.length > 0 && (
          <section className="bg-white rounded-3xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Flame className="size-5 text-red-500" />
              Pain Points
            </h3>
            <div className="space-y-2">
              {prospect.profile.pain_points.map((pain, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="size-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 capitalize">{pain}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {prospect.profile?.life_events && prospect.profile.life_events.length > 0 && (
          <section className="bg-white rounded-3xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Recent Life Events</h3>
            <div className="space-y-2">
              {prospect.profile.life_events.map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="size-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{event}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="font-bold text-gray-900">AI-Powered Actions</h3>

          <button
            onClick={() => setShowMessageModal(true)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white rounded-2xl hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <MessageCircle className="size-6" />
              </div>
              <div className="text-left">
                <div className="font-bold">Generate Outreach Message</div>
                <div className="text-xs text-white/80">3 coins</div>
              </div>
            </div>
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => {
              if (canAccessFeature('sequence')) {
                setShowSequenceModal(true);
              } else {
                setUpgradeFeature('sequence');
                setShowUpgradeModal(true);
              }
            }}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-[#1877F2] transition-all relative overflow-hidden"
          >
            {!canAccessFeature('sequence') && (
              <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Lock className="size-3" />
                Pro Only
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <MessageCircle className="size-6 text-[#1877F2]" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Generate Follow-Up Sequence</div>
                <div className="text-xs text-gray-600">4-7 message series • 7 coins</div>
              </div>
            </div>
            <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Generate Pitch Deck - SuperAdmin Only */}
          {profile?.is_super_admin && (
            <button
              disabled
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl transition-all relative overflow-hidden opacity-75 cursor-not-allowed"
            >
              <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10">
                <Lock className="size-3" />
                Coming Soon
              </div>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                  <FileText className="size-6 text-[#1877F2]" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">Generate Pitch Deck</div>
                  <div className="text-xs text-gray-600">6-slide presentation • 12 coins</div>
                </div>
              </div>
              <Lock className="size-5 text-gray-400" />
            </button>
          )}

          {/* AI DeepScan Analysis - SuperAdmin Only */}
          {profile?.is_super_admin && (
            <button
              disabled
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-2xl transition-all relative overflow-hidden opacity-75 cursor-not-allowed"
            >
              <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10">
                <Lock className="size-3" />
                Coming Soon
              </div>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Sparkles className="size-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">AI DeepScan Analysis</div>
                  <div className="text-xs text-gray-700">Full personality & buying profile • 12 coins</div>
                </div>
              </div>
              <Lock className="size-5 text-gray-700" />
            </button>
          )}

          {/* AI-Powered Call */}
          <button
            onClick={() => {
              alert('AI-Powered Call feature coming soon! This will allow you to make AI-assisted calls to prospects.');
            }}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-500 transition-all relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10">
              <Lock className="size-3" />
              Coming Soon
            </div>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                <Phone className="size-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">AI-Powered Call</div>
                <div className="text-xs text-gray-600">AI-assisted phone call • Coming soon</div>
              </div>
            </div>
            <Lock className="size-5 text-gray-400" />
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-gray-900">Pipeline Actions</h3>

          {/* Only show "Add to Pipeline" button if prospect is not already in pipeline */}
          {!prospect?.pipeline_stage && (
            <button
              onClick={() => onNavigate('pipeline', { prospectId: prospect.id })}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-500 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                  <Plus className="size-6 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">Add to Pipeline</div>
                  <div className="text-xs text-gray-600">Move to engagement workflow</div>
                </div>
              </div>
              <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setShowReminderModal(true)}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <Bell className="size-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Set Reminder</div>
                <div className="text-xs text-gray-600">Schedule follow-up notification</div>
              </div>
            </div>
            <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* Notes Section at Bottom */}
        {prospect?.bio_text || prospect?.metadata?.notes ? (
          <section className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Notes</h3>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {prospect.bio_text || prospect.metadata?.notes}
            </p>
          </section>
        ) : null}

        <div className="h-24" />
      </main>

      {/* Manage Prospect Modal */}
      {prospect && (
        <ManageProspectModal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          prospectId={prospect.id}
          prospect={prospect}
          sessionData={{
            visitor_name: latestSession?.visitor_name,
            visitor_email: latestSession?.visitor_email,
            visitor_phone: latestSession?.visitor_phone,
            conversation_context: latestSession?.conversation_context
          }}
          onProspectUpdated={async () => {
            await loadLatestSession();
            setIsEditingVisitorInfo(false);
            if (prospectId) {
              await loadProspect();
              await loadLatestSession();
              setIsEditingVisitorInfo(false);
              // If prospect was deleted, navigate back
              const { data: exists } = await supabase
                .from('prospects')
                .select('id')
                .eq('id', prospectId)
                .maybeSingle();
              if (!exists) {
                onBack();
              }
            } else if (prospect?.id) {
              // Refresh prospect data
              try {
                const { data, error } = await supabase
                  .from('prospects')
                  .select('*')
                  .eq('id', prospect.id)
                  .maybeSingle();
                
                if (error) {
                  console.error('[ProspectDetail] Error refreshing prospect after update:', error);
                  return;
                }
                
                if (data) {
                  setProspect({
                    ...prospect,
                    ...data,
                    metadata: data.metadata || {}
                  });
                }
              } catch (error) {
                console.error('[ProspectDetail] Unexpected error refreshing prospect:', error);
              }
            }
          }}
        />
      )}

      {/* Set Reminder Modal */}
      {prospect && (
        <SetReminderModal
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          prospectId={prospect.id}
          prospectName={prospect.full_name}
          onSuccess={() => {
            // Optionally show success message or refresh data
          }}
        />
      )}

      <GenerateMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        prospectId={prospect.id}
        prospectName={prospect.full_name}
        userId={profile?.id || ''}
        onSuccess={(message) => {
          console.log('Message generated:', message);
        }}
      />

      <GenerateSequenceModal
        isOpen={showSequenceModal}
        onClose={() => setShowSequenceModal(false)}
        prospectId={prospect.id}
        prospectName={prospect.full_name}
        userId={profile?.id || ''}
        userTier={(profile?.subscription_tier as 'free' | 'pro') || 'free'}
      />

      <GenerateDeckModal
        isOpen={showDeckModal}
        onClose={() => setShowDeckModal(false)}
        prospectId={prospect.id}
        prospectName={prospect.full_name}
        userId={profile?.id || ''}
        userTier={(profile?.subscription_tier as 'free' | 'pro') || 'free'}
      />

      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Manage Prospect Photo</h2>
              <button
                onClick={() => setShowPhotoUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ProspectPhotoUpload
              prospect={prospect}
              userId={user?.id || ''}
              onUploadSuccess={(url) => {
                setProspect({ ...prospect, uploaded_image_url: url });
                setShowPhotoUpload(false);
              }}
              onDeleteSuccess={() => {
                const updated = { ...prospect, uploaded_image_url: null };
                setProspect(updated);
                setShowPhotoUpload(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Premium Automation Modals */}
      {automation.showPreview && automation.previewData && (
        <AutomationPreviewModal
          isOpen={automation.showPreview}
          action={automation.previewData.action || 'follow_up'}
          prospectName={prospect?.full_name || 'Prospect'}
          generatedContent={automation.previewData.content || {}}
          estimatedOutcome={{
            replyRate: 0.34,
            estimatedRevenue: 6800,
          }}
          cost={AUTOMATION_COSTS[automation.previewData.action] || AUTOMATION_COSTS.smart_scan}
          onApprove={automation.previewData.onApprove}
          onRegenerate={async () => {
            console.log('Regenerating...');
          }}
          onCancel={() => automation.setShowPreview(false)}
        />
      )}

      {automation.showProgress && automation.progressData && (
        <AutomationProgressModal
          isOpen={automation.showProgress}
          action="Processing Automation"
          prospectName={prospect?.full_name || 'Prospect'}
          steps={automation.progressData.steps}
          currentStep={automation.progressData.currentStep}
          estimatedTotal={automation.progressData.estimatedTotal}
          onCancel={() => automation.setShowProgress(false)}
        />
      )}

      {/* Floating Action Button (FAB) */}
      {/* Backdrop blur when expanded - outside container to avoid blocking */}
      {fabExpanded && <div className="fab-backdrop" onClick={() => setFabExpanded(false)} />}
      
      <div className="fab-container" ref={fabRef}>
        {/* Action Buttons */}
        <div className={`fab-actions ${fabExpanded ? 'fab-actions-expanded' : ''}`}>
          {/* Messenger Button */}
          <button
            className="fab-action-btn fab-messenger"
            onClick={handleFabMessenger}
            title="AI Chat"
            aria-label="Open AI Chat"
          >
            <span className="fab-label">AI Chat</span>
            <MessageSquare className="fab-icon" size={20} />
          </button>
          
          {/* SMS Button */}
          <button
            className="fab-action-btn fab-sms"
            onClick={handleFabSMS}
            title="SMS"
            aria-label="Send SMS"
          >
            <span className="fab-label">SMS</span>
            <MessageCircle className="fab-icon" size={20} />
          </button>
          
          {/* Call Button */}
          <button
            className="fab-action-btn fab-call"
            onClick={handleFabCall}
            title="Call"
            aria-label="Make Call"
          >
            <span className="fab-label">Call</span>
            <Phone className="fab-icon" size={20} />
          </button>
        </div>
        
        {/* Main FAB Toggle */}
        <button
          className="fab-main"
          onClick={() => setFabExpanded(!fabExpanded)}
          data-fab="main"
          aria-label={fabExpanded ? 'Close actions' : 'Open actions'}
          aria-expanded={fabExpanded}
        >
          {fabExpanded ? (
            <X className="fab-icon" size={22} />
          ) : (
            <MessageSquare className="fab-icon" size={22} />
          )}
        </button>
      </div>

      {/* ScoutScore Debug Panel Modal */}
      {showDebugPanel && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDebugPanel(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900">ScoutScore Debug Analysis</h2>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                aria-label="Close debug panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ScoutScoreDebugPanel 
                leadId={prospect.id} 
                testMode={false}
                onClose={() => setShowDebugPanel(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom FAB Styles */}
      <style>{`
        .fab-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 998;
          animation: fab-backdrop-fade-in 0.2s ease-out;
          pointer-events: auto;
        }

        .fab-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          display: inline;
          flex-direction: column-reverse;
          align-items: flex-end;
          gap: 0;
        }

        @keyframes fab-backdrop-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .fab-main {
          float: right;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 1001;
          position: relative;
        }

        .fab-main:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .fab-main:active {
          transform: scale(0.98);
        }

        .fab-main .fab-icon {
          color: white;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .fab-main[aria-expanded="true"] {
          background: #000000;
        }

        .fab-main[aria-expanded="true"] .fab-icon {
          transform: rotate(90deg);
        }

        .fab-actions {
          display: flex;
          flex-direction: column-reverse;
          gap: 16px;
          margin-bottom: 0;
          opacity: 0;
          transform: translateY(20px) scale(0.8);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          z-index: 1001;
        }

        .fab-actions-expanded {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
          margin-bottom: 16px;
          z-index: 1001;
        }

        .fab-action-btn {
          width: auto;
          min-width: 48px;
          height: 48px;
          border-radius: 24px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding: 0 12px 0 16px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          z-index: 1002;
        }

        .fab-label {
          color: white;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
        }

        .fab-action-btn:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .fab-action-btn:active {
          transform: scale(0.95);
        }

        .fab-action-btn .fab-icon {
          color: white;
        }

        .fab-call {
          background: linear-gradient(135deg, #48D988 0%, #3BC473 100%);
        }

        .fab-sms {
          background: linear-gradient(135deg, #F45DA0 0%, #E6399B 100%);
        }

        .fab-messenger {
          background: linear-gradient(135deg, #2D7FF9 0%, #1E6FE5 100%);
        }

        .fab-actions-expanded .fab-action-btn:nth-child(1) {
          animation: fab-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
        }

        .fab-actions-expanded .fab-action-btn:nth-child(2) {
          animation: fab-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
        }

        .fab-actions-expanded .fab-action-btn:nth-child(3) {
          animation: fab-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
        }

        @keyframes fab-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 390px) {
          .fab-container {
            bottom: 16px;
            right: 16px;
          }

          .fab-actions {
            gap: 14px;
          }

          .fab-actions-expanded {
            margin-bottom: 14px;
          }

          .fab-main {
            width: 52px;
            height: 52px;
          }

          .fab-action-btn {
            width: auto;
            min-width: 44px;
            height: 44px;
            border-radius: 22px;
            padding: 0 10px 0 14px;
          }

          .fab-action-btn .fab-icon {
            width: 18px;
            height: 18px;
          }

          .fab-main .fab-icon {
            width: 20px;
            height: 20px;
          }

          .fab-label {
            font-size: 12px;
          }
        }

        @media (min-width: 391px) and (max-width: 768px) {
          .fab-container {
            bottom: 20px;
            right: 20px;
          }
        }
      `}</style>

    </div>
  );
}
