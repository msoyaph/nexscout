import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Package, TrendingUp, Clock, Sparkles, ExternalLink, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ProductListPageProps {
  onBack: () => void;
  onNavigate: (page: string, params?: any) => void;
}

type Product = {
  id: string;
  name: string;
  main_category: string;
  short_description: string;
  tags: string[];
  active: boolean;
  competitive_position: string | null;
  strength_score: number;
  intel_last_run_at: string | null;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
};

export default function ProductListPage({ onBack, onNavigate }: ProductListPageProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'with_intel' | 'needs_setup'>('all');

  useEffect(() => {
    loadProducts();
  }, [user, filterStatus]);

  const loadProducts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filterStatus === 'active') {
        query = query.eq('active', true);
      } else if (filterStatus === 'with_intel') {
        query = query.not('intel_last_run_at', 'is', null);
      } else if (filterStatus === 'needs_setup') {
        query = query.is('intel_last_run_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.main_category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIntelStatus = (product: Product) => {
    if (!product.intel_last_run_at) {
      return { text: 'No intel yet', color: 'bg-slate-100 text-slate-600' };
    }

    const daysSince = Math.floor(
      (Date.now() - new Date(product.intel_last_run_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince === 0) {
      return { text: 'Intel updated today', color: 'bg-green-100 text-green-700' };
    } else if (daysSince <= 7) {
      return { text: `Intel updated ${daysSince}d ago`, color: 'bg-blue-100 text-blue-700' };
    } else {
      return { text: `Intel outdated (${daysSince}d)`, color: 'bg-yellow-100 text-yellow-700' };
    }
  };

  const getPositionBadge = (position: string | null) => {
    if (!position) return null;

    const config: Record<string, { color: string; text: string }> = {
      strong: { color: 'bg-green-100 text-green-700', text: 'Strong' },
      average: { color: 'bg-yellow-100 text-yellow-700', text: 'Average' },
      weak: { color: 'bg-red-100 text-red-700', text: 'Weak' },
    };

    const badge = config[position] || config.average;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-24">
      <header className="bg-white px-6 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-white flex items-center justify-center border border-[#E5E7EB] shadow-sm"
          >
            <ArrowLeft className="size-5 text-[#111827]" />
          </button>
          <h1 className="text-xl font-bold">My Products</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('product-analytics')}
              className="size-10 rounded-full bg-white flex items-center justify-center border border-[#E5E7EB] shadow-sm hover:bg-[#F3F4F6] transition-colors"
              title="View Analytics"
            >
              <TrendingUp className="size-5 text-blue-600" />
            </button>
            <button
              onClick={() => onNavigate('add-product')}
              className="size-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
            >
              <Plus className="size-5 text-white" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'with_intel', label: 'With Intel' },
            { value: 'needs_setup', label: 'Needs Setup' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as any)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                filterStatus === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 pt-6">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center border border-[#E5E7EB] shadow-sm">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Package className="size-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">No products yet</h3>
            <p className="text-[#6B7280] mb-6">
              Add your first product to get started with AI-powered selling
            </p>
            <button
              onClick={() => onNavigate('add-product')}
              className="px-6 py-3 bg-blue-600 text-white rounded-[16px] font-semibold shadow-lg hover:bg-blue-700 transition-colors"
            >
              Add Product
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const intelStatus = getIntelStatus(product);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="size-16 rounded-[12px] object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="size-16 rounded-[12px] bg-slate-100 flex items-center justify-center">
                        <Package className="size-8 text-slate-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-[#111827] truncate">{product.name}</h3>
                        {getPositionBadge(product.competitive_position)}
                      </div>

                      <p className="text-sm text-[#6B7280] line-clamp-2 mb-3">
                        {product.short_description || 'No description'}
                      </p>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
                          {product.main_category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${intelStatus.color}`}>
                          {intelStatus.text}
                        </span>
                        {product.strength_score > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {product.strength_score}/100
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate('product-detail', { id: product.id })}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-[12px] text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Sparkles className="size-4" />
                          View Intel
                        </button>

                        {product.product_url && (
                          <button
                            onClick={() => window.open(product.product_url!, '_blank')}
                            className="py-2 px-4 border-2 border-[#E5E7EB] text-[#6B7280] rounded-[12px] text-sm font-semibold hover:bg-[#F3F4F6] transition-colors"
                          >
                            <ExternalLink className="size-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onNavigate('chatbot-link', { productId: product.id })}
                          className="py-2 px-4 border-2 border-[#E5E7EB] text-[#6B7280] rounded-[12px] text-sm font-semibold hover:bg-[#F3F4F6] transition-colors"
                          title="Use in Chatbot"
                        >
                          <MessageSquare className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
