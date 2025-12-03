import { useState } from 'react';
import { ArrowLeft, BookOpen, TrendingUp, Target, Lightbulb, Star, Clock, Award, ChevronRight, Play, FileText, Users, Sparkles, Trophy, GraduationCap } from 'lucide-react';

interface TrainingHubPageProps {
  onNavigateBack: () => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  modules: number;
  category: string;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  readTime: string;
  category: string;
  author: string;
}

interface SuccessStory {
  id: string;
  name: string;
  role: string;
  company: string;
  story: string;
  achievement: string;
  image: string;
}

export default function TrainingHubPage({ onNavigateBack }: TrainingHubPageProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'articles' | 'stories' | 'tips'>('courses');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const courses: Course[] = [
    {
      id: '1',
      title: 'Sales Fundamentals: From Cold Call to Close',
      description: 'Master the art of prospecting, qualifying leads, handling objections, and closing deals. Learn proven techniques used by top performers.',
      duration: '4 weeks',
      level: 'Beginner',
      modules: 12,
      category: 'Sales Basics'
    },
    {
      id: '2',
      title: 'Advanced Negotiation Strategies',
      description: 'Learn sophisticated negotiation tactics, psychological principles, and win-win strategies to close bigger deals with better margins.',
      duration: '3 weeks',
      level: 'Advanced',
      modules: 10,
      category: 'Sales Mastery'
    },
    {
      id: '3',
      title: 'Digital Marketing Essentials',
      description: 'Understand SEO, SEM, social media marketing, content strategy, and analytics. Build a complete digital presence for your business.',
      duration: '5 weeks',
      level: 'Beginner',
      modules: 15,
      category: 'Digital Marketing'
    },
    {
      id: '4',
      title: 'Social Selling on LinkedIn',
      description: 'Transform LinkedIn into your most powerful sales tool. Build authority, generate inbound leads, and close deals on social media.',
      duration: '2 weeks',
      level: 'Intermediate',
      modules: 8,
      category: 'Digital Marketing'
    },
    {
      id: '5',
      title: 'Email Marketing That Converts',
      description: 'Write compelling email campaigns, build automated sequences, and maximize open rates and conversions.',
      duration: '3 weeks',
      level: 'Intermediate',
      modules: 9,
      category: 'Digital Marketing'
    },
    {
      id: '6',
      title: 'The Psychology of Selling',
      description: 'Understand buyer psychology, influence principles, and emotional triggers that drive purchasing decisions.',
      duration: '4 weeks',
      level: 'Advanced',
      modules: 11,
      category: 'Sales Mastery'
    },
    {
      id: '7',
      title: 'Building a Sales Pipeline That Scales',
      description: 'Design systematic processes for lead generation, qualification, nurturing, and conversion that grow with your business.',
      duration: '3 weeks',
      level: 'Intermediate',
      modules: 10,
      category: 'Sales Strategy'
    },
    {
      id: '8',
      title: 'Account-Based Marketing Strategy',
      description: 'Target high-value accounts with personalized campaigns. Master ABM tactics for B2B sales success.',
      duration: '4 weeks',
      level: 'Advanced',
      modules: 12,
      category: 'Sales Strategy'
    }
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: '7 Proven Ways to Overcome Sales Objections',
      excerpt: 'Every objection is an opportunity in disguise. Learn how to reframe resistance, address concerns authentically, and turn skeptics into buyers.',
      readTime: '8 min read',
      category: 'Sales Techniques',
      author: 'Michael Chen'
    },
    {
      id: '2',
      title: 'The Art of the Follow-Up: Persistence Without Being Pushy',
      excerpt: 'Most sales are made after the 5th follow-up, yet most salespeople stop after the 2nd. Discover the balance between persistence and professionalism.',
      readTime: '6 min read',
      category: 'Sales Techniques',
      author: 'Sarah Johnson'
    },
    {
      id: '3',
      title: 'Why Your LinkedIn Profile Is Costing You Sales',
      excerpt: 'Your LinkedIn profile is your digital storefront. Make sure it\'s working for you 24/7 with these optimization strategies.',
      readTime: '10 min read',
      category: 'Digital Marketing',
      author: 'David Park'
    },
    {
      id: '4',
      title: 'Cold Email Templates That Get 40%+ Response Rates',
      excerpt: 'Forget generic pitches. These proven email frameworks focus on value, relevance, and timing to get decision-makers to respond.',
      readTime: '12 min read',
      category: 'Digital Marketing',
      author: 'Emily Rodriguez'
    },
    {
      id: '5',
      title: 'Building Trust Remotely: Virtual Selling Best Practices',
      excerpt: 'Video calls lack the rapport-building power of face-to-face meetings. Here\'s how to create genuine connections through a screen.',
      readTime: '7 min read',
      category: 'Sales Techniques',
      author: 'James Wilson'
    },
    {
      id: '6',
      title: 'The SPIN Selling Method Explained',
      excerpt: 'Situation, Problem, Implication, Need-payoff. Master this consultative approach to uncover needs and close complex B2B deals.',
      readTime: '15 min read',
      category: 'Sales Strategy',
      author: 'Rachel Green'
    },
    {
      id: '7',
      title: 'How to Qualify Leads in 5 Minutes or Less',
      excerpt: 'Stop wasting time on unqualified prospects. Use the BANT framework and strategic questioning to quickly identify real opportunities.',
      readTime: '5 min read',
      category: 'Sales Strategy',
      author: 'Marcus Thompson'
    },
    {
      id: '8',
      title: 'Content Marketing for Sales Professionals',
      excerpt: 'Position yourself as a thought leader. Create content that attracts, educates, and converts your ideal customers.',
      readTime: '9 min read',
      category: 'Digital Marketing',
      author: 'Lisa Anderson'
    }
  ];

  const successStories: SuccessStory[] = [
    {
      id: '1',
      name: 'Maria Santos',
      role: 'Insurance Agent',
      company: 'Pacific Life Insurance',
      story: 'I was struggling to find quality leads and spending hours on cold calls that went nowhere. After implementing NexScout\'s AI-powered prospecting and following the Sales Fundamentals course, my conversion rate tripled in just 2 months.',
      achievement: '3x increase in conversions, ₱2.5M in new policies',
      image: 'MS'
    },
    {
      id: '2',
      name: 'Carlos Reyes',
      role: 'Real Estate Broker',
      company: 'Metro Properties',
      story: 'The LinkedIn Social Selling course completely changed my approach. I went from chasing cold leads to having qualified prospects reaching out to me. NexScout helped me identify high-value property buyers I never would have found.',
      achievement: '₱45M in closed deals, 85% increase in inbound leads',
      image: 'CR'
    },
    {
      id: '3',
      name: 'Jennifer Lim',
      role: 'B2B Sales Manager',
      company: 'TechFlow Solutions',
      story: 'Our team was hitting a plateau. The Advanced Negotiation course and NexScout\'s pipeline management transformed how we operate. We\'re now closing enterprise deals we previously thought were out of reach.',
      achievement: 'Team quota exceeded by 156%, average deal size up 40%',
      image: 'JL'
    },
    {
      id: '4',
      name: 'Robert Tan',
      role: 'Financial Advisor',
      company: 'Wealth Builders Inc.',
      story: 'The Email Marketing course taught me to nurture relationships at scale. Combined with NexScout\'s targeted prospect lists, I built an automated system that generates qualified meetings while I sleep.',
      achievement: '120+ new clients in 6 months, ₱18M AUM growth',
      image: 'RT'
    }
  ];

  const nexscoutTips = [
    {
      id: '1',
      icon: Target,
      title: 'Use AI Deep Scan for Hidden Opportunities',
      tip: 'Before reaching out to a prospect, run an AI Deep Scan to uncover recent company news, funding rounds, or leadership changes. These insights give you the perfect conversation starter.',
      category: 'NexScout Feature'
    },
    {
      id: '2',
      icon: Sparkles,
      title: 'Leverage AI Message Sequencer',
      tip: 'Don\'t send generic messages. Use the AI Message Sequencer to create personalized, multi-touch campaigns that adapt based on prospect engagement and behavior.',
      category: 'NexScout Feature'
    },
    {
      id: '3',
      icon: Users,
      title: 'Organize with Pipeline Stages',
      tip: 'Move prospects through custom pipeline stages. This helps you focus on the right activities at the right time and never lose track of a hot lead.',
      category: 'Best Practice'
    },
    {
      id: '4',
      icon: Clock,
      title: 'Best Time to Prospect',
      tip: 'Studies show Tuesday-Thursday, 10 AM - 12 PM and 2 PM - 4 PM have the highest response rates. Schedule your outreach during these windows for maximum impact.',
      category: 'Best Practice'
    },
    {
      id: '5',
      icon: Star,
      title: 'Quality Over Quantity',
      tip: 'Spending coins on 10 highly-targeted, deeply-researched prospects beats 100 random contacts. Use filters wisely and prioritize relevance over volume.',
      category: 'Best Practice'
    },
    {
      id: '6',
      icon: TrendingUp,
      title: 'Track Your Metrics',
      tip: 'Monitor your conversion rates at each pipeline stage. If prospects stall at a certain point, that\'s where you need to improve your process.',
      category: 'Best Practice'
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-blue-100 text-blue-700';
      case 'Advanced': return 'bg-orange-100 text-orange-700';
      case 'Expert': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const categories = ['all', 'Sales Basics', 'Sales Mastery', 'Sales Strategy', 'Digital Marketing'];

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-28">
      <header className="px-6 pt-8 pb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onNavigateBack}
            className="flex items-center justify-center size-11 hover:bg-white/20 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-6" />
          </button>
          <h1 className="text-lg font-semibold">Training Hub</h1>
          <div className="size-11" />
        </div>

        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-2">Master Sales & Marketing</h2>
          <p className="text-blue-100 text-sm">
            Learn from the best. Grow your skills. Close more deals.
          </p>
        </div>

        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'courses'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
            }`}
          >
            <GraduationCap className="size-4 inline mr-2" />
            Courses
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'articles'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
            }`}
          >
            <FileText className="size-4 inline mr-2" />
            Articles
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'stories'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
            }`}
          >
            <Trophy className="size-4 inline mr-2" />
            Success Stories
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'tips'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
            }`}
          >
            <Lightbulb className="size-4 inline mr-2" />
            Tips & Hacks
          </button>
        </div>
      </header>

      <main className="px-6 mt-6 space-y-6">
        {activeTab === 'courses' && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
                  }`}
                >
                  {cat === 'all' ? 'All Courses' : cat}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredCourses.map(course => (
                <div key={course.id} className="bg-white rounded-[24px] p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                        <span className="text-xs text-gray-500">{course.category}</span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="size-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="size-4" />
                        {course.modules} modules
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors">
                      <Play className="size-4" />
                      Start Course
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[24px] p-6 border border-green-200">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                  <Award className="size-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 mb-2">Complete Courses, Earn Certifications</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Showcase your expertise with verified certifications. Share them on LinkedIn to attract better opportunities and build credibility with prospects.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'articles' && (
          <div className="space-y-4">
            {articles.map(article => (
              <div key={article.id} className="bg-white rounded-[24px] p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="size-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-blue-600">{article.category}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{article.readTime}</span>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2">{article.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">By {article.author}</span>
                      <button className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700">
                        Read More
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stories' && (
          <>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-[24px] p-6 border border-orange-200">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-full bg-orange-600 flex items-center justify-center shrink-0">
                  <Trophy className="size-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 mb-2">Real People. Real Results.</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Learn from professionals who transformed their sales careers with NexScout and our training programs.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {successStories.map(story => (
                <div key={story.id} className="bg-white rounded-[24px] p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="size-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {story.image}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base text-gray-900">{story.name}</h3>
                      <p className="text-sm text-gray-600">{story.role}</p>
                      <p className="text-xs text-gray-500">{story.company}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-[16px] p-4 mb-4 border-l-4 border-blue-600">
                    <p className="text-sm text-gray-700 italic leading-relaxed">
                      "{story.story}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Star className="size-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900">{story.achievement}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-[24px] p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Want to Share Your Success Story?</h3>
              <p className="text-sm text-blue-100 mb-4 leading-relaxed">
                We'd love to feature your journey and inspire other sales professionals. Your story could help someone achieve their breakthrough.
              </p>
              <button className="px-6 py-3 bg-white text-blue-600 rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors">
                Submit Your Story
              </button>
            </div>
          </>
        )}

        {activeTab === 'tips' && (
          <>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[24px] p-6 border border-purple-200">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="size-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 mb-2">NexScout Hacks & Tips</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Insider tips to maximize your results with NexScout and proven sales best practices from top performers.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {nexscoutTips.map(tip => (
                <div key={tip.id} className="bg-white rounded-[24px] p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <tip.icon className="size-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {tip.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 mb-2">{tip.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{tip.tip}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-6 border border-blue-200">
              <h3 className="font-bold text-base text-gray-900 mb-3">Quick Sales Tips</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Always Ask for Referrals</p>
                    <p className="text-xs text-gray-600 mt-1">Happy clients are your best source of qualified leads. Make referral requests part of your standard process.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Listen More Than You Talk</p>
                    <p className="text-xs text-gray-600 mt-1">The best salespeople listen 70% of the time and talk 30%. Understand the problem before pitching the solution.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Focus on Value, Not Features</p>
                    <p className="text-xs text-gray-600 mt-1">Customers don't buy features, they buy outcomes. Frame everything in terms of their success and ROI.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Master the Art of Timing</p>
                    <p className="text-xs text-gray-600 mt-1">Know when to push and when to back off. Sometimes the best move is giving space and following up later.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">5</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Build Genuine Relationships</p>
                    <p className="text-xs text-gray-600 mt-1">People buy from people they like and trust. Invest in relationships beyond the transaction.</p>
                  </div>
                </li>
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
