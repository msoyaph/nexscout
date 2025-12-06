import { useState, useEffect } from 'react';
import { X, Gift, AlertCircle } from 'lucide-react';
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

export default function AutomationQuotaModal() {
  const { user } = useAuth();
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkAndShowModal();
    }
  }, [user?.id]);

  const checkAndShowModal = async () => {
    const lastShown = localStorage.getItem('automation_quota_modal_last_shown');
    const today = new Date().toDateString();
    if (lastShown === today) return;

    try {
      const { data, error } = await supabase.rpc('get_automation_quota_status', { p_user_id: user!.id });
      if (error || !data) return;
      setQuotaStatus(data);
      setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem('automation_quota_modal_last_shown', today);
      }, 2000);
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible || !quotaStatus) return null;

  const percentUsed = (quotaStatus.quota_used / quotaStatus.quota_total) * 100;
  const isLow = quotaStatus.quota_remaining <= 10;
  const isCritical = quotaStatus.quota_remaining <= 5;

  return (
    <>
      <div className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isClosing ? 'opacity-0' : 'opacity-20'}`} onClick={handleClose} />
      <div className={`fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50 transition-transform duration-300 ease-out ${isClosing ? 'translate-y-full md:translate-y-0 md:translate-x-full' : 'translate-y-0 md:translate-x-0'}`}>
        <div className={`bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border ${isCritical ? 'border-red-400' : isLow ? 'border-yellow-400' : 'border-blue-400'} border-t-4`}>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCritical ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                {quotaStatus.has_free_quota ? <Gift className="w-6 h-6 text-white" /> : <AlertCircle className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{quotaStatus.tier === 'pro' ? 'Premium Automation' : 'Free Automations'}</h3>
                <p className="text-xs text-gray-600">Monthly quota update</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{quotaStatus.quota_used} / {quotaStatus.quota_total} used</span>
                <span className={`text-sm font-bold ${isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-blue-600'}`}>{quotaStatus.quota_remaining} left</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${isCritical ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${percentUsed}%` }} />
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isCritical ? 'bg-red-50' : isLow ? 'bg-yellow-50' : 'bg-blue-50'}`}>
              <p className="text-sm text-gray-800">{isCritical ? <>⚠️ Only <strong>{quotaStatus.quota_remaining}</strong> free automations left!</> : isLow ? <>💡 <strong>{quotaStatus.quota_remaining}</strong> free automations remaining.</> : <>✅ You have <strong>{quotaStatus.quota_remaining}</strong> free automations.</>}</p>
            </div>
            {quotaStatus.tier === 'free' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">🚀 Upgrade to Pro for <strong>50 free automations/month</strong>!</p>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg">Upgrade to Pro (₱1,299/mo)</button>
              </div>
            )}
            <div className="md:hidden text-center pt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
              <p className="text-xs text-gray-500">Swipe down to dismiss</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
