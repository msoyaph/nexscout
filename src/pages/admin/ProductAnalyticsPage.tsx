import { useState, useEffect } from 'react';
import { ArrowLeft, Package, TrendingUp, Users, Target, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ProductAnalyticsPageProps {
  onBack: () => void;
}

interface ProductStats {
  productId: string;
  productName: string;
  totalRecommendations: number;
  offeredCount: number;
  acceptedCount: number;
  rejectedCount: number;
  averageMatchScore: number;
  conversionRate: number;
  revenue: number;
}

export default function ProductAnalyticsPage({ onBack }: ProductAnalyticsPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalProducts: 0,
    totalRecommendations: 0,
    totalOffers: 0,
    totalAccepted: 0,
    overallConversionRate: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  async function loadAnalytics() {
    if (!user) return;

    setLoading(true);
    try {
      // Get all products
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user.id);

      if (!products) return;

      // Get recommendations for each product
      const productStats: ProductStats[] = [];

      for (const product of products) {
        const { data: recommendations } = await supabase
          .from('product_recommendations')
          .select('match_score, status')
          .eq('product_id', product.id)
          .eq('user_id', user.id);

        if (!recommendations) continue;

        const total = recommendations.length;
        const offered = recommendations.filter(r => r.status === 'offered' || r.status === 'accepted').length;
        const accepted = recommendations.filter(r => r.status === 'accepted').length;
        const rejected = recommendations.filter(r => r.status === 'rejected').length;
        const avgScore = total > 0
          ? recommendations.reduce((sum, r) => sum + (r.match_score || 0), 0) / total
          : 0;
        const conversionRate = offered > 0 ? (accepted / offered) * 100 : 0;

        productStats.push({
          productId: product.id,
          productName: product.name,
          totalRecommendations: total,
          offeredCount: offered,
          acceptedCount: accepted,
          rejectedCount: rejected,
          averageMatchScore: avgScore,
          conversionRate,
          revenue: 0, // TODO: Calculate from actual sales
        });
      }

      // Sort by total recommendations
      productStats.sort((a, b) => b.totalRecommendations - a.totalRecommendations);
      setStats(productStats);

      // Calculate overall stats
      const totalRecs = productStats.reduce((sum, s) => sum + s.totalRecommendations, 0);
      const totalOffers = productStats.reduce((sum, s) => sum + s.offeredCount, 0);
      const totalAccepted = productStats.reduce((sum, s) => sum + s.acceptedCount, 0);

      setOverallStats({
        totalProducts: products.length,
        totalRecommendations: totalRecs,
        totalOffers: totalOffers,
        totalAccepted: totalAccepted,
        overallConversionRate: totalOffers > 0 ? (totalAccepted / totalOffers) * 100 : 0,
        totalRevenue: 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
          >
            <ArrowLeft className="size-5 text-[#6B7280]" />
          </button>
          <h1 className="text-xl font-bold">Product Analytics</h1>
          <div className="size-10" />
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="size-5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Products</span>
            </div>
            <div className="text-3xl font-bold text-[#111827]">
              {overallStats.totalProducts}
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="size-5 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Matches</span>
            </div>
            <div className="text-3xl font-bold text-[#111827]">
              {overallStats.totalRecommendations}
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="size-5 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Offers</span>
            </div>
            <div className="text-3xl font-bold text-[#111827]">
              {overallStats.totalOffers}
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="size-5 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Accepted</span>
            </div>
            <div className="text-3xl font-bold text-[#111827]">
              {overallStats.totalAccepted}
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Conv. Rate</span>
            </div>
            <div className="text-3xl font-bold text-[#111827]">
              {overallStats.overallConversionRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="size-5 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Revenue</span>
            </div>
            <div className="text-3xl font-bold text-[#111827]">
              ₱{overallStats.totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Product Performance */}
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
              <TrendingUp className="size-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Product Performance</h2>
              <p className="text-sm text-[#6B7280]">Top performing products by recommendations</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#6B7280] mt-2">Loading analytics...</p>
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center py-8">
              <Package className="size-12 text-[#6B7280] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">No product data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.map((stat) => (
                <div
                  key={stat.productId}
                  className="p-4 bg-[#F9FAFB] rounded-[16px] border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#111827] mb-1">{stat.productName}</h3>
                      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                        <span>Avg Score: {stat.averageMatchScore.toFixed(1)}/100</span>
                        <span>•</span>
                        <span>Conv. Rate: {stat.conversionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Matches</div>
                      <div className="text-lg font-bold text-blue-600">
                        {stat.totalRecommendations}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Offered</div>
                      <div className="text-lg font-bold text-orange-600">
                        {stat.offeredCount}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Accepted</div>
                      <div className="text-lg font-bold text-green-600">
                        {stat.acceptedCount}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Rejected</div>
                      <div className="text-lg font-bold text-red-600">
                        {stat.rejectedCount}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all"
                        style={{
                          width: `${Math.min(100, stat.conversionRate)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-[24px] p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="size-6" />
            <h2 className="text-lg font-bold">Key Insights</h2>
          </div>

          <div className="space-y-3">
            {stats.length > 0 && (
              <>
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    <strong>{stats[0].productName}</strong> is your top performing product with{' '}
                    {stats[0].totalRecommendations} recommendations
                  </p>
                </div>

                {overallStats.overallConversionRate > 0 && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Your overall conversion rate is{' '}
                      <strong>{overallStats.overallConversionRate.toFixed(1)}%</strong>
                      {overallStats.overallConversionRate >= 20 ? ' - Excellent!' : ' - Keep optimizing!'}
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <CheckCircle className="size-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    You've made <strong>{overallStats.totalOffers}</strong> product offers
                    {overallStats.totalOffers > 10 && ' - Great activity!'}
                  </p>
                </div>
              </>
            )}

            {stats.length === 0 && (
              <p className="text-sm">
                Add products and start scanning prospects to see analytics here!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
