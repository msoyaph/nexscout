import { useState, useEffect } from 'react';
import { User, Brain, AlertCircle, MessageSquare, FileText, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProductMatchCard from './products/ProductMatchCard';
import { trackProductEvent } from '../services/products/productMatchingEngine';

interface ProspectDetailTabsProps {
  prospect: {
    id?: string;
    name: string;
    summary?: string;
    personality?: string[];
    painPoints?: string[];
    suggestedMessages?: string[];
  };
  onGenerateDeck?: () => void;
  onGenerateMessage?: () => void;
}

export default function ProspectDetailTabs({
  prospect,
  onGenerateDeck,
  onGenerateMessage
}: ProspectDetailTabsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'personality' | 'pain' | 'messages' | 'deck' | 'products'>('summary');
  const [productMatches, setProductMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (activeTab === 'products' && prospect.id && user) {
      loadProductMatches();
    }
  }, [activeTab, prospect.id, user]);

  async function loadProductMatches() {
    if (!prospect.id || !user) return;

    setLoadingMatches(true);
    try {
      const { data, error } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          products (
            id,
            name,
            short_description,
            image_url,
            base_price,
            product_url
          )
        `)
        .eq('prospect_id', prospect.id)
        .eq('user_id', user.id)
        .order('match_score', { ascending: false });

      if (error) throw error;
      setProductMatches(data || []);
    } catch (error) {
      console.error('Error loading product matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  }

  async function handleOfferProduct(match: any) {
    if (!user) return;

    try {
      await supabase
        .from('product_recommendations')
        .update({
          status: 'offered',
          offered_at: new Date().toISOString(),
        })
        .eq('id', match.id);

      await trackProductEvent(user.id, 'product_offered', 'recommendation', {
        productId: match.product_id,
        prospectId: prospect.id,
        match_score: match.match_score,
        confidence_level: match.confidence_level,
      });

      loadProductMatches();
      alert('Product offered! You can now follow up with the prospect.');
    } catch (error) {
      console.error('Error offering product:', error);
      alert('Failed to offer product. Please try again.');
    }
  }

  async function handleRejectProduct(match: any) {
    if (!user) return;

    try {
      await supabase
        .from('product_recommendations')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', match.id);

      loadProductMatches();
    } catch (error) {
      console.error('Error rejecting product:', error);
    }
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: User },
    { id: 'personality', label: 'Personality', icon: Brain },
    { id: 'pain', label: 'Pain Points', icon: AlertCircle },
    { id: 'products', label: 'Product Matches', icon: Package },
    { id: 'messages', label: 'AI Messages', icon: MessageSquare },
    { id: 'deck', label: 'Pitch Deck', icon: FileText }
  ];

  return (
    <div className="bg-white rounded-3xl overflow-hidden">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {activeTab === 'summary' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Prospect Summary</h3>
            <p className="text-gray-700 leading-relaxed">
              {prospect.summary || `${prospect.name} is a qualified prospect identified through AI analysis. Review the other tabs for detailed personality insights, pain points, and AI-generated messaging suggestions.`}
            </p>
          </div>
        )}

        {activeTab === 'personality' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Personality Profile</h3>
            <div className="space-y-3">
              {(prospect.personality || ['Analytical', 'Results-driven', 'Detail-oriented']).map((trait, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-2xl">
                  <div className="size-2 rounded-full bg-blue-600 mt-2" />
                  <p className="text-sm text-gray-700">{trait}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pain' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pain Points Detected</h3>
            <div className="space-y-3">
              {(prospect.painPoints || ['Needs efficiency improvements', 'Looking for scalable solutions', 'Budget constraints']).map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-2xl">
                  <AlertCircle className="size-5 text-red-600 shrink-0" />
                  <p className="text-sm text-gray-700">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">AI-Generated Messages</h3>
              {onGenerateMessage && (
                <button
                  onClick={onGenerateMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Generate New
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(prospect.suggestedMessages || [
                'Hi [Name], I noticed your interest in [topic]. Would love to share how we can help.',
                'Your recent post about [pain point] resonated with me. Let\'s connect!',
                'Saw you\'re looking for [solution]. We specialize in exactly that.'
              ]).map((message, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">{message}</p>
                  <button className="text-xs text-blue-600 font-semibold hover:underline">
                    Copy Message
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Product Matches</h3>

            {loadingMatches ? (
              <div className="text-center py-8">
                <div className="inline-block size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600 mt-2">Loading matches...</p>
              </div>
            ) : productMatches.length > 0 ? (
              <div className="space-y-4">
                {productMatches.map((match) => (
                  <ProductMatchCard
                    key={match.id}
                    match={match}
                    onOffer={() => handleOfferProduct(match)}
                    onReject={() => handleRejectProduct(match)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="size-20 rounded-3xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="size-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Product Matches Yet</h3>
                <p className="text-gray-600 mb-6">
                  Add products to your catalog to see AI-powered recommendations for {prospect.name}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deck' && (
          <div className="text-center py-8">
            <div className="size-20 rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <FileText className="size-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Pitch Deck Generator</h3>
            <p className="text-gray-600 mb-6">
              Generate a personalized pitch deck for {prospect.name} using AI insights
            </p>
            {onGenerateDeck && (
              <button
                onClick={onGenerateDeck}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
              >
                Generate Pitch Deck
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
