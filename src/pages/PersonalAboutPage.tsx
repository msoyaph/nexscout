import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, TrendingUp, Target, Star, Award, Facebook, Linkedin, Instagram, Twitter, Plus, Edit3, Briefcase, Package, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AboutContent {
  bio_headline: string;
  bio_story: string;
  career_journey: string;
  personality_traits: string[];
  social_profiles: any;
}

interface CoachRecommendation {
  id: string;
  recommendation_type: string;
  title: string;
  content: string;
  current_level: string;
  target_level: string;
  priority: string;
  action_items: string[];
  is_completed: boolean;
}

interface CompanyProduct {
  id: string;
  company_name: string;
  company_description: string;
  company_logo_url: string;
  products: any[];
}

interface PersonalAboutPageProps {
  onNavigateBack?: () => void;
  onNavigate?: (page: string) => void;
  uniqueUserId?: string;
}

export default function PersonalAboutPage({ onNavigateBack, onNavigate, uniqueUserId }: PersonalAboutPageProps) {
  const auth = useAuth();
  const profile = auth?.profile;
  const [userId, setUserId] = useState<string | null>(null);
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [recommendations, setRecommendations] = useState<CoachRecommendation[]>([]);
  const [companyProducts, setCompanyProducts] = useState<CompanyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('newbie');
  const [isPublicView, setIsPublicView] = useState(false);

  useEffect(() => {
    loadUser();
  }, [uniqueUserId]);

  const loadUser = async () => {
    if (uniqueUserId) {
      // Public view - get user from unique_user_id
      setIsPublicView(true);
      const { data, error } = await supabase.rpc('get_user_from_unique_id', {
        p_unique_id: uniqueUserId
      });
      if (data) {
        setUserId(data);
        loadData(data);
      } else {
        console.error('User not found:', error);
        setLoading(false);
      }
    } else {
      // Authenticated view - use current user
      setIsPublicView(false);
      if (profile?.id) {
        setUserId(profile.id);
        loadData(profile.id);
      }
    }
  };

  const loadData = async (targetUserId?: string) => {
    try {
      setLoading(true);
      const uid = targetUserId || profile?.id;

      const [aboutRes, recsRes, companyRes] = await Promise.all([
        supabase.from('user_about_content').select('*').single(),
        supabase.from('ai_coach_recommendations').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('company_products').select('*'),
      ]);

      if (aboutRes.data) setAboutContent(aboutRes.data);
      if (recsRes.data) setRecommendations(recsRes.data);
      if (companyRes.data) setCompanyProducts(companyRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (contentType: 'bio' | 'coach' | 'all') => {
    try {
      setGenerating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-about-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content_type: contentType, current_level: currentLevel }),
        }
      );

      const result = await response.json();

      if (result.success) {
        await loadData();
      } else {
        throw new Error(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const levelColors: Record<string, string> = {
    newbie: '#10B981',
    rising_star: '#F59E0B',
    professional: '#3B82F6',
    top_earner: '#8B5CF6',
  };

  const levelLabels: Record<string, string> = {
    newbie: 'Newbie',
    rising_star: 'Rising Star',
    professional: 'Professional',
    top_earner: 'Top Earner',
  };

  const priorityColors: Record<string, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-8">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateBack}
              className="flex items-center justify-center size-9 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-700" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">About Me</h1>
            <div className="size-9" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

          <div className="relative flex items-start gap-6">
            <div className="size-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold border-4 border-white/40">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{profile?.full_name || 'User'}</h2>
              {aboutContent?.bio_headline ? (
                <p className="text-lg text-white/90 mb-4">{aboutContent.bio_headline}</p>
              ) : (
                <p className="text-lg text-white/80 mb-4">Generate your personalized bio with AI</p>
              )}

              <div className="flex items-center gap-3">
                <div
                  className="px-4 py-1.5 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: levelColors[currentLevel] + '20', color: levelColors[currentLevel] }}
                >
                  {levelLabels[currentLevel]}
                </div>

                {profile?.profession && (
                  <div className="px-4 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                    {profile.profession}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => generateContent('all')}
              disabled={generating}
              className="px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {['newbie', 'rising_star', 'professional', 'top_earner'].map((level) => (
            <button
              key={level}
              onClick={() => setCurrentLevel(level)}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                currentLevel === level
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>

        {aboutContent && (
          <>
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">My Story</h3>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aboutContent.bio_story}</p>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Career Journey</h3>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aboutContent.career_journey}</p>
            </section>

            {aboutContent.personality_traits && aboutContent.personality_traits.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Personality Traits</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aboutContent.personality_traits.map((trait, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl text-sm font-medium text-slate-700"
                    >
                      {trait}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {companyProducts.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">My Company & Products</h3>
              </div>
            </div>

            <div className="space-y-6">
              {companyProducts.map((company) => (
                <div key={company.id} className="border-l-4 border-orange-500 pl-4">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{company.company_name}</h4>
                  {company.company_description && (
                    <p className="text-slate-600 mb-4">{company.company_description}</p>
                  )}

                  {company.products && company.products.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {company.products.map((product: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Package className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-900">{product.name}</h5>
                            {product.description && (
                              <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">AI Coach Recommendations</h3>
              </div>

              <button
                onClick={() => generateContent('coach')}
                disabled={generating}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="border-l-4 pl-4 py-3"
                  style={{ borderColor: priorityColors[rec.priority] }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900">{rec.title}</h4>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: priorityColors[rec.priority] + '20',
                            color: priorityColors[rec.priority],
                          }}
                        >
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        {rec.recommendation_type.replace('_', ' ').toUpperCase()} • {levelLabels[rec.current_level]} → {levelLabels[rec.target_level]}
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line mb-3">
                    {rec.content}
                  </p>

                  {rec.action_items && rec.action_items.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase">Action Items:</p>
                      <div className="space-y-1">
                        {rec.action_items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {aboutContent?.social_profiles && Object.keys(aboutContent.social_profiles).length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-100 rounded-xl">
                <Star className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Connect With Me</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {aboutContent.social_profiles.facebook && (
                <a
                  href={aboutContent.social_profiles.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                  <span className="font-medium">Facebook</span>
                </a>
              )}

              {aboutContent.social_profiles.linkedin && (
                <a
                  href={aboutContent.social_profiles.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span className="font-medium">LinkedIn</span>
                </a>
              )}

              {aboutContent.social_profiles.instagram && (
                <a
                  href={aboutContent.social_profiles.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                  <span className="font-medium">Instagram</span>
                </a>
              )}

              {aboutContent.social_profiles.twitter && (
                <a
                  href={aboutContent.social_profiles.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  <span className="font-medium">Twitter</span>
                </a>
              )}
            </div>
          </section>
        )}

        {!aboutContent && !loading && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Create Your AI-Powered Profile</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Generate a personalized bio, career journey, and AI coach recommendations tailored to your MLM level
            </p>
            <button
              onClick={() => generateContent('all')}
              disabled={generating}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate My Profile</span>
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
