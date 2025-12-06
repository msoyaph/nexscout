import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Gift, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface QuotaStatus {
  quota_total: number;
  quota_used: number;
  quota_remaining: number;
  days_until_reset: number;
  has_free_quota: boolean;
  tier: string;
}

export default function AutomationQuotaDisplay() {
  const { user, profile } = useAuth();
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadQuotaStatus();
    }
  }, [user?.id]);

  const loadQuotaStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_automation_quota_status', { p_user_id: user.id });

      if (error) {
        // Function doesn't exist yet (migrations not deployed)
        console.log('Quota function not yet deployed');
        // Don't show widget if function doesn't exist
        setQuotaStatus(null);
        setLoading(false);
        return;
      }
      
      setQuotaStatus(data);
    } catch (error) {
      console.error('Error loading quota status:', error);
      // Hide widget on error
      setQuotaStatus(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quotaStatus) {
    return null;
  }

  const percentUsed = (quotaStatus.quota_used / quotaStatus.quota_total) * 100;
  const isLow = quotaStatus.quota_remaining <= 10;
  const isCritical = quotaStatus.quota_remaining <= 5;

  // Don't show for enterprise (unlimited)
  if (quotaStatus.tier === 'enterprise') {
    return null;
  }

  return (
    <div className={`rounded-lg border-2 p-4 ${
      isCritical ? 'bg-red-50 border-red-300' :
      isLow ? 'bg-yellow-50 border-yellow-300' :
      'bg-blue-50 border-blue-300'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isCritical ? 'bg-red-500' :
            isLow ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}>
            {quotaStatus.has_free_quota ? (
              <Gift className="w-5 h-5 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              {quotaStatus.tier === 'pro' ? 'Premium Automation Bundle' : 'Free Automations'}
            </h3>
            <p className="text-xs text-gray-600">
              {quotaStatus.tier === 'pro' ? '50 free per month' : `${quotaStatus.quota_total} per month`}
            </p>
          </div>
        </div>
        
        {quotaStatus.tier === 'pro' && (
          <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
            PRO
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">
            {quotaStatus.quota_used} / {quotaStatus.quota_total} used
          </span>
          <span className={`text-xs font-bold ${
            isCritical ? 'text-red-600' :
            isLow ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {quotaStatus.quota_remaining} remaining
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isCritical ? 'bg-red-500' :
              isLow ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="flex items-start gap-2">
        {quotaStatus.has_free_quota ? (
          <div className="flex-1">
            <p className="text-xs text-gray-700">
              {isCritical ? (
                <>
                  ⚠️ Only <strong>{quotaStatus.quota_remaining}</strong> free automations left!
                  After that, automations cost coins.
                </>
              ) : isLow ? (
                <>
                  💡 <strong>{quotaStatus.quota_remaining}</strong> free automations remaining.
                  Use them wisely!
                </>
              ) : (
                <>
                  ✅ You have <strong>{quotaStatus.quota_remaining}</strong> free automations.
                  {quotaStatus.tier === 'pro' && ' Resets in ' + quotaStatus.days_until_reset + ' days.'}
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-xs text-gray-700">
              ❌ No free automations remaining this month.
              Resets in <strong>{quotaStatus.days_until_reset} days</strong>.
            </p>
            <p className="text-xs text-blue-600 font-medium mt-1">
              💡 Automations now cost coins. Buy more coins to continue automating!
            </p>
          </div>
        )}
      </div>

      {/* Upgrade CTA (for free users) */}
      {quotaStatus.tier === 'free' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            🚀 Upgrade to Pro for <strong>50 free automations/month</strong>!
          </p>
          <button className="w-full px-3 py-2 bg-[#1877F2] text-white rounded-lg text-xs font-semibold hover:bg-[#0C5DBE] transition-colors">
            Upgrade to Pro (₱1,299/mo)
          </button>
        </div>
      )}

      {/* Buy Coins CTA (for users out of quota) */}
      {!quotaStatus.has_free_quota && quotaStatus.tier !== 'free' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Buy Coins to Continue Automating
          </button>
        </div>
      )}
    </div>
  );
}

