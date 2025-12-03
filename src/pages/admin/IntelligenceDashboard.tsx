// PURPOSE: Unified Intelligence Suite dashboard for admin
// INPUT: Admin user access
// OUTPUT: Analytics, funnels, predictions, retention, viral metrics
// NOTES: Integrates all Intelligence v2.0 engines

import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Target, Zap, Share2, AlertTriangle } from 'lucide-react';
import { funnelEngine } from '../../services/intelligence/funnelEngine';
import { mlPredictionEngine } from '../../services/intelligence/mlPredictionEngine';
import { retentionEngine } from '../../services/intelligence/retentionEngine';
import { viralEngine } from '../../services/intelligence/viralEngine';
import { abTestingEngine } from '../../services/intelligence/abTestingEngine';

export default function IntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'funnels' | 'predictions' | 'retention' | 'viral' | 'experiments'>('overview');
  const [loading, setLoading] = useState(true);

  // Funnel data
  const [funnelData, setFunnelData] = useState<any[]>([]);

  // Prediction data
  const [upgradeTargets, setUpgradeTargets] = useState<any[]>([]);
  const [churnRisks, setChurnRisks] = useState<any[]>([]);

  // Retention data
  const [retentionPerformance, setRetentionPerformance] = useState<any[]>([]);

  // Viral data
  const [viralMetrics, setViralMetrics] = useState<any>(null);
  const [viralTriggers, setViralTriggers] = useState<any[]>([]);

  // Experiments
  const [activeExperiments, setActiveExperiments] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      // Load funnel data
      const funnels = await funnelEngine.analyzeAllFunnels(30);
      setFunnelData(funnels);

      // Load predictions
      const upgrades = await mlPredictionEngine.getHighUpgradePotentialUsers(20);
      const churns = await mlPredictionEngine.getHighChurnRiskUsers(20);
      setUpgradeTargets(upgrades);
      setChurnRisks(churns);

      // Load retention data
      const retention = await retentionEngine.getPlaybookPerformance();
      setRetentionPerformance(retention);

      // Load viral metrics
      const viral = await viralEngine.getOverallMetrics();
      const triggers = await viralEngine.getTriggerPerformance();
      setViralMetrics(viral);
      setViralTriggers(triggers);

      // Load experiments
      const experiments = await abTestingEngine.getActiveExperiments();
      setActiveExperiments(experiments);
    } catch (error) {
      console.error('Failed to load intelligence data:', error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Intelligence Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Intelligence Suite v2.0</h1>
              <p className="text-gray-600 mt-1">Advanced analytics, predictions & optimization</p>
            </div>
            <button
              onClick={loadAllData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[88px] z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'funnels', label: 'Funnels', icon: TrendingUp },
              { id: 'predictions', label: 'Predictions', icon: Target },
              { id: 'retention', label: 'Retention', icon: Users },
              { id: 'viral', label: 'Viral Loop', icon: Share2 },
              { id: 'experiments', label: 'Experiments', icon: Zap },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab funnels={funnelData} viral={viralMetrics} upgrades={upgradeTargets.length} churns={churnRisks.length} />}
        {activeTab === 'funnels' && <FunnelsTab funnels={funnelData} />}
        {activeTab === 'predictions' && <PredictionsTab upgrades={upgradeTargets} churns={churnRisks} />}
        {activeTab === 'retention' && <RetentionTab performance={retentionPerformance} />}
        {activeTab === 'viral' && <ViralTab metrics={viralMetrics} triggers={viralTriggers} />}
        {activeTab === 'experiments' && <ExperimentsTab experiments={activeExperiments} />}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ funnels, viral, upgrades, churns }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Funnel Completion"
          value={`${Math.round(funnels.reduce((sum: number, f: any) => sum + f.completion_rate, 0) / Math.max(funnels.length, 1))}%`}
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard
          title="Upgrade Targets"
          value={upgrades}
          icon={Target}
          color="green"
          subtitle="High probability users"
        />
        <MetricCard
          title="Churn Risks"
          value={churns}
          icon={AlertTriangle}
          color="red"
          subtitle="Require intervention"
        />
        <MetricCard
          title="Viral K-Factor"
          value={viral?.average_k_factor?.toFixed(2) || '0.00'}
          icon={Share2}
          color="purple"
          subtitle={viral?.average_k_factor >= 1.0 ? 'Viral growth! 🚀' : 'Below viral threshold'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Insights</h3>
          <div className="space-y-3">
            <InsightItem
              text={`${funnels.find((f: any) => f.funnel_name === 'Conversion')?.total_entered || 0} users hit paywall this month`}
              type="info"
            />
            <InsightItem
              text={`Activation funnel has ${funnels.find((f: any) => f.funnel_name === 'Activation')?.completion_rate.toFixed(0) || 0}% completion rate`}
              type={Number(funnels.find((f: any) => f.funnel_name === 'Activation')?.completion_rate) > 50 ? 'success' : 'warning'}
            />
            <InsightItem
              text={`${viral?.super_spreaders_count || 0} super spreaders driving referrals`}
              type="success"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Actions</h3>
          <div className="space-y-3">
            <ActionItem text="Review high drop-off points in Activation funnel" priority="high" />
            <ActionItem text="Send targeted upgrade offers to 20 high-probability users" priority="medium" />
            <ActionItem text="Execute retention campaigns for at-risk users" priority="high" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Funnels Tab
function FunnelsTab({ funnels }: any) {
  return (
    <div className="space-y-6">
      {funnels.map((funnel: any) => (
        <div key={funnel.funnel_name} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{funnel.funnel_name} Funnel</h3>
              <p className="text-gray-600">
                {funnel.completed} / {funnel.total_entered} completed ({funnel.completion_rate.toFixed(1)}%)
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Bottleneck</div>
              <div className="text-lg font-bold text-red-600">Step {funnel.bottleneck_step}</div>
            </div>
          </div>

          <div className="space-y-4">
            {funnel.steps.map((step: any, index: number) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      step.drop_off_rate > 40 ? 'bg-red-500' : step.drop_off_rate > 20 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                      {step.step_number}
                    </div>
                    <span className="font-medium text-gray-900">{step.step_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{step.users_reached} users</div>
                    {step.drop_off_count > 0 && (
                      <div className="text-sm text-red-600">-{step.drop_off_count} ({step.drop_off_rate.toFixed(1)}% drop)</div>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(step.users_reached / funnel.total_entered) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Predictions Tab
function PredictionsTab({ upgrades, churns }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upgrade Targets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Target className="mr-2 text-green-600" size={24} />
          High Upgrade Potential ({upgrades.length})
        </h3>
        <div className="space-y-3">
          {upgrades.slice(0, 10).map((user: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">User {user.user_id.slice(0, 8)}...</span>
                <span className="text-lg font-bold text-green-600">{Math.round(user.probability * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${user.probability * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                <strong>Top factors:</strong> {user.top_positive_factors.slice(0, 2).join(', ')}
              </div>
              <div className="text-sm text-blue-600 mt-2">
                <strong>Action:</strong> {user.recommended_action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Churn Risks */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="mr-2 text-red-600" size={24} />
          High Churn Risk ({churns.length})
        </h3>
        <div className="space-y-3">
          {churns.slice(0, 10).map((user: any, index: number) => (
            <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">User {user.user_id.slice(0, 8)}...</span>
                <span className={`text-lg font-bold ${
                  user.probability >= 0.7 ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {Math.round(user.probability * 100)}% risk
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${user.probability * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-700">
                <strong>Risk factors:</strong> {user.top_positive_factors.slice(0, 2).join(', ')}
              </div>
              <div className="text-sm text-red-700 mt-2 font-medium">
                <strong>Intervention:</strong> {user.recommended_action}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Retention Tab
function RetentionTab({ performance }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Playbook Performance</h3>
        <div className="space-y-4">
          {performance.map((playbook: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900">{playbook.playbook_name}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  playbook.recovery_rate >= 30 ? 'bg-green-100 text-green-800' :
                  playbook.recovery_rate >= 20 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {playbook.recovery_rate.toFixed(1)}% recovery
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{playbook.campaigns_sent}</div>
                  <div className="text-sm text-gray-600">Campaigns Sent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{playbook.users_recovered}</div>
                  <div className="text-sm text-gray-600">Users Recovered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{playbook.recovery_rate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Viral Tab
function ViralTab({ metrics, triggers }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Shares" value={metrics?.total_shares || 0} icon={Share2} color="purple" />
        <MetricCard title="Total Referrals" value={metrics?.total_referrals || 0} icon={Users} color="green" />
        <MetricCard title="Avg K-Factor" value={metrics?.average_k_factor?.toFixed(2) || '0.00'} icon={TrendingUp} color="blue" />
        <MetricCard title="Super Spreaders" value={metrics?.super_spreaders_count || 0} icon={Zap} color="yellow" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Viral Trigger Performance</h3>
        <div className="space-y-3">
          {triggers.map((trigger: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-900">{trigger.trigger_name}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  trigger.k_factor >= 1.0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  K = {trigger.k_factor.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Shares:</span>
                  <span className="ml-2 font-medium">{trigger.total_shares}</span>
                </div>
                <div>
                  <span className="text-gray-600">Conversions:</span>
                  <span className="ml-2 font-medium">{trigger.total_conversions}</span>
                </div>
                <div>
                  <span className="text-gray-600">Conversion Rate:</span>
                  <span className="ml-2 font-medium">
                    {trigger.total_shares > 0 ? ((trigger.total_conversions / trigger.total_shares) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Experiments Tab
function ExperimentsTab({ experiments }: any) {
  return (
    <div className="space-y-6">
      {experiments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <Zap size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Experiments</h3>
          <p className="text-gray-600">Create A/B tests to optimize conversions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp: any) => (
            <div key={exp.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{exp.name}</h3>
              <p className="text-gray-600 mb-4">{exp.description}</p>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {exp.status}
                </span>
                <span className="text-sm text-gray-600">
                  Goal: {exp.goal_metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, icon: Icon, color, subtitle }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function InsightItem({ text, type }: { text: string; type: 'info' | 'success' | 'warning' }) {
  const colors = {
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    success: 'bg-green-50 text-green-900 border-green-200',
    warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[type]}`}>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

function ActionItem({ text, priority }: { text: string; priority: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="flex items-start space-x-3">
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority]} mt-0.5`}>
        {priority.toUpperCase()}
      </span>
      <p className="text-sm text-gray-700 flex-1">{text}</p>
    </div>
  );
}
