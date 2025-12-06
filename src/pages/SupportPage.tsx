import { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, MessageSquare, Search, Send, Mail, Phone, Clock, CheckCircle, AlertCircle, Loader, FileText, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SupportPageProps {
  onNavigateBack: () => void;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export default function SupportPage({ onNavigateBack }: SupportPageProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'help' | 'tickets' | 'contact'>('help');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // SuperAdmin check - only geoffmax22@gmail.com can see full support page
  const isSuperAdmin = user?.email === 'geoffmax22@gmail.com';

  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    }
  }, [activeTab]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setTickets(data);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.message) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: profile?.id,
          subject: newTicket.subject,
          message: newTicket.message,
          priority: newTicket.priority,
          status: 'open'
        });

      if (!error) {
        setNewTicket({ subject: '', message: '', priority: 'medium' });
        setShowNewTicket(false);
        loadTickets();
        setActiveTab('tickets');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const helpArticles = [
    {
      category: 'Getting Started',
      icon: '🚀',
      articles: [
        { title: 'How to create your first prospect scan', link: '#' },
        { title: 'Understanding the AI scanning process', link: '#' },
        { title: 'Setting up your profile for best results', link: '#' },
        { title: 'Navigating the dashboard', link: '#' }
      ]
    },
    {
      category: 'Subscriptions & Billing',
      icon: '💳',
      articles: [
        { title: 'Choosing the right plan for your needs', link: '#' },
        { title: 'How to upgrade or downgrade your plan', link: '#' },
        { title: 'Understanding the 7-day money-back guarantee', link: '#' },
        { title: 'Managing your payment methods', link: '#' },
        { title: 'Viewing invoices and payment history', link: '#' }
      ]
    },
    {
      category: 'Coins & Features',
      icon: '🪙',
      articles: [
        { title: 'How the coin economy works', link: '#' },
        { title: 'Earning daily coins and bonuses', link: '#' },
        { title: 'What happens to coins when I cancel?', link: '#' },
        { title: 'Unlocking premium features with coins', link: '#' }
      ]
    },
    {
      category: 'AI Features',
      icon: '🤖',
      articles: [
        { title: 'Using AI Message Sequencer', link: '#' },
        { title: 'Understanding AI DeepScan results', link: '#' },
        { title: 'Creating AI-powered pitch decks', link: '#' },
        { title: 'Interpreting personality detection', link: '#' }
      ]
    },
    {
      category: 'Account & Security',
      icon: '🔒',
      articles: [
        { title: 'Resetting your password', link: '#' },
        { title: 'Updating profile information', link: '#' },
        { title: 'Data privacy and security', link: '#' },
        { title: 'Deleting your account', link: '#' }
      ]
    },
    {
      category: 'Troubleshooting',
      icon: '🔧',
      articles: [
        { title: 'AI scan not working properly', link: '#' },
        { title: 'Payment failed or declined', link: '#' },
        { title: 'Missing coins or features', link: '#' },
        { title: 'App running slow or crashing', link: '#' }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    };

    const labels = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-slate-100 text-slate-700',
      medium: 'bg-orange-100 text-orange-700',
      high: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[priority as keyof typeof styles]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredArticles = helpArticles.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.articles.length > 0);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      // Store contact message in database
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user?.id || null,
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject || 'Support Contact Form Submission',
          message: contactForm.message,
          status: 'new',
          created_at: new Date().toISOString()
        });

      // If table doesn't exist, we'll still try to send email
      if (dbError && dbError.code !== '42P01') { // 42P01 = table doesn't exist
        console.warn('Could not save to database:', dbError);
      }

      // Send email via edge function
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              fromEmail: contactForm.email,
              fromName: contactForm.name,
              subject: contactForm.subject || 'Support Contact Form Submission from NexScout',
              message: contactForm.message,
              toEmail: 'geoffmax22@gmail.com', // Hidden from user
            }),
          }
        );

        if (!response.ok) {
          // If edge function doesn't exist, that's okay - message is stored in DB
          console.warn('Email edge function not available, message saved to database');
        }
      } catch (emailError) {
        // Email sending failed, but message is stored
        console.warn('Email sending failed, but message is saved:', emailError);
      }

      setSent(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => {
        setShowContactModal(false);
        setSent(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error sending contact message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onNavigateBack}
            className="flex items-center justify-center size-11 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Support</h1>
          <div className="size-11" />
        </div>

        {isSuperAdmin && (
          <div className="flex gap-2 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('help')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeTab === 'help'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280]'
              }`}
            >
              Help Center
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeTab === 'tickets'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280]'
              }`}
            >
              My Tickets
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeTab === 'contact'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280]'
              }`}
            >
              Contact Us
            </button>
          </div>
        )}
      </header>

      <main className="px-6 mt-6 space-y-4">
        {!isSuperAdmin ? (
          // Regular users see only Contact button
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-8 border-2 border-blue-200 text-center">
            <div className="size-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="size-8 text-white" />
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">We're Here to Help</h3>
            <p className="text-sm text-gray-600 mb-6">
              Have questions or need assistance? Get in touch with our support team.
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <Mail className="size-5" />
              Contact Support
            </button>
          </div>
        ) : (
          // SuperAdmin sees full support page
          <>
            {activeTab === 'help' && (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-[20px] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            {(searchQuery ? filteredArticles : helpArticles).map((category) => (
              <div key={category.category} className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="font-bold text-lg text-[#111827]">{category.category}</h3>
                </div>
                <div className="space-y-2">
                  {category.articles.map((article, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center justify-between p-3 rounded-[16px] hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="size-4 text-[#6B7280]" />
                        <span className="text-sm text-[#111827] group-hover:text-blue-600">{article.title}</span>
                      </div>
                      <ChevronRight className="size-4 text-[#9CA3AF] group-hover:text-blue-600" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {searchQuery && filteredArticles.length === 0 && (
              <div className="bg-white rounded-[24px] p-12 border border-[#E5E7EB] shadow-sm text-center">
                <HelpCircle className="size-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-[#6B7280] mb-4">No articles found for "{searchQuery}"</p>
                <button
                  onClick={() => {
                    setShowNewTicket(true);
                    setActiveTab('tickets');
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-[16px] font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  Submit a Ticket
                </button>
              </div>
            )}
          </>
        )}

            {activeTab === 'tickets' && (
          <>
            {!showNewTicket ? (
              <>
                <button
                  onClick={() => setShowNewTicket(true)}
                  className="w-full py-3 bg-blue-600 text-white rounded-[20px] font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Create New Ticket
                </button>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="size-8 text-blue-600 animate-spin" />
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white rounded-[24px] p-5 border border-[#E5E7EB] shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#111827] mb-1">{ticket.subject}</h3>
                            <p className="text-xs text-[#9CA3AF]">{formatDate(ticket.created_at)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                        <p className="text-sm text-[#6B7280] line-clamp-2">{ticket.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[24px] p-12 border border-[#E5E7EB] shadow-sm text-center">
                    <MessageSquare className="size-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-sm text-[#6B7280] mb-4">No support tickets yet</p>
                    <p className="text-xs text-[#9CA3AF]">Create a ticket to get help from our support team</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
                <h3 className="font-bold text-lg text-[#111827] mb-4">Create Support Ticket</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-2">Subject</label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-3 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-2">Priority</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setNewTicket({ ...newTicket, priority })}
                          className={`flex-1 py-2 px-4 rounded-[16px] text-sm font-semibold transition-colors ${
                            newTicket.priority === priority
                              ? priority === 'high'
                                ? 'bg-red-600 text-white'
                                : priority === 'medium'
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-2">Message</label>
                    <textarea
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      placeholder="Provide detailed information about your issue..."
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowNewTicket(false)}
                      className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-[20px] font-semibold text-sm hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createTicket}
                      disabled={!newTicket.subject || !newTicket.message || loading}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-[20px] font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader className="size-4 animate-spin" /> : <Send className="size-4" />}
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

            {activeTab === 'contact' && (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-6 border border-blue-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="size-14 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="size-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-[#111827] mb-2">We're Here to Help</h3>
                  <p className="text-sm text-[#6B7280]">
                    Our support team is available to assist you with any questions or issues. Choose your preferred contact method below.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="size-5 text-blue-600" />
                <h3 className="font-bold text-lg text-[#111827]">Email Support</h3>
              </div>
              <p className="text-sm text-[#6B7280] mb-3">
                Send us an email and we'll respond within 24 hours
              </p>
              <a
                href="mailto:support@company.com"
                className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                support@company.com
              </a>
            </div>

            <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="size-5 text-green-600" />
                <h3 className="font-bold text-lg text-[#111827]">Phone Support</h3>
              </div>
              <p className="text-sm text-[#6B7280] mb-3">
                Talk to our support team directly
              </p>
              <a
                href="tel:+63-2-8888-8888"
                className="inline-block text-sm font-semibold text-green-600 hover:text-green-700"
              >
                +63 2 8888 8888
              </a>
            </div>

            <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="size-5 text-orange-600" />
                <h3 className="font-bold text-lg text-[#111827]">Business Hours</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Monday - Friday</span>
                  <span className="font-semibold text-[#111827]">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Saturday</span>
                  <span className="font-semibold text-[#111827]">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Sunday</span>
                  <span className="font-semibold text-[#111827]">Closed</span>
                </div>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-4">
                Philippine Standard Time (GMT+8)
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[24px] p-6 border-2 border-green-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="size-6 text-green-600" />
                <h3 className="font-bold text-lg text-[#111827]">Response Times</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-red-500"></div>
                  <span className="text-sm text-[#6B7280]">High Priority: Within 2 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-[#6B7280]">Medium Priority: Within 8 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-slate-500"></div>
                  <span className="text-sm text-[#6B7280]">Low Priority: Within 24 hours</span>
                </div>
              </div>
            </div>
          </>
            )}
          </>
        )}
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Contact Support</h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setSent(false);
                  setContactForm({ name: '', email: '', subject: '', message: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="size-5 text-gray-600" />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="size-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h4>
                <p className="text-sm text-gray-600">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What can we help you with?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell us how we can help..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowContactModal(false);
                      setContactForm({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
