import { useState, useEffect } from 'react';
import { Bot, Play, Pause, Square, Zap, Coins, RefreshCw, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AIPipelineAutomationService, AI_OPERATION_COSTS } from '../services/aiPipelineAutomation';

interface AIPipelineControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyClick?: () => void;
}

export default function AIPipelineControlPanel({ isOpen, onClose, onBuyClick }: AIPipelineControlPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [resources, setResources] = useState({ energy: 0, coins: 0 });

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load settings
      const userSettings = await AIPipelineAutomationService.getSettings(user.id);
      setSettings(userSettings);

      // Load active jobs
      const jobs = await AIPipelineAutomationService.getActiveJobs(user.id);
      setActiveJobs(jobs);

      // Load resources
      const availability = await AIPipelineAutomationService.checkResourceAvailability(user.id, 'smart_scan');
      setResources({
        energy: availability.energy,
        coins: availability.coins
      });
    } catch (error) {
      console.error('Error loading AI pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async (jobType: keyof typeof AI_OPERATION_COSTS) => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await AIPipelineAutomationService.createJob(user.id, jobType);

      if (result.success && result.jobId) {
        // Start the job immediately
        await AIPipelineAutomationService.startJob(result.jobId);
        await loadData();
      } else {
        // Show purchase nudge if insufficient resources
        if (result.error?.includes('Insufficient resources') && onBuyClick) {
          onClose();
          onBuyClick();
        } else {
          alert(result.error || 'Failed to start AI job');
        }
      }
    } catch (error) {
      console.error('Error starting job:', error);
      alert('Failed to start AI job');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseJob = async (jobId: string) => {
    setLoading(true);
    try {
      await AIPipelineAutomationService.pauseJob(jobId);
      await loadData();
    } catch (error) {
      console.error('Error pausing job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeJob = async (jobId: string) => {
    setLoading(true);
    try {
      await AIPipelineAutomationService.resumeJob(jobId);
      await loadData();
    } catch (error) {
      console.error('Error resuming job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopJob = async (jobId: string) => {
    setLoading(true);
    try {
      await AIPipelineAutomationService.stopJob(jobId);
      await loadData();
    } catch (error) {
      console.error('Error stopping job:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; text: string }> = {
      queued: { color: 'bg-gray-100 text-gray-700', icon: Clock, text: 'Queued' },
      running: { color: 'bg-blue-100 text-blue-700', icon: Play, text: 'Running' },
      paused: { color: 'bg-yellow-100 text-yellow-700', icon: Pause, text: 'Paused' },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-700', icon: AlertCircle, text: 'Failed' },
      stopped: { color: 'bg-gray-100 text-gray-700', icon: Square, text: 'Stopped' }
    };

    const badge = badges[status] || badges.queued;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getJobTypeLabel = (jobType: string) => {
    const labels: Record<string, string> = {
      smart_scan: 'Smart Pipeline Scan',
      follow_up: 'Auto Follow-Up',
      qualify: 'Qualify Prospect',
      nurture: 'Nurture Lead',
      book_meeting: 'Book Meeting',
      close_deal: 'Close Deal',
      full_pipeline: 'Full Pipeline Automation'
    };
    return labels[jobType] || jobType;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Facebook Style */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Pipeline Automation</h2>
              <p className="text-sm text-gray-600">Automate your sales workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Resources Bar */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Energy</p>
                  <p className="text-base font-semibold text-gray-900">{resources.energy}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Coins</p>
                  <p className="text-base font-semibold text-gray-900">{resources.coins}</p>
                </div>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStartJob('smart_scan')}
                disabled={loading}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1877F2] hover:bg-blue-50 transition-all disabled:opacity-50 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>{AI_OPERATION_COSTS.smart_scan.energy}</span>
                    <Coins className="w-3 h-3 text-orange-500 ml-1" />
                    <span>{AI_OPERATION_COSTS.smart_scan.coins}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Smart Scan</h4>
                <p className="text-xs text-gray-600">Analyze and optimize pipeline</p>
              </button>

              <button
                onClick={() => handleStartJob('full_pipeline')}
                disabled={loading}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1877F2] hover:bg-blue-50 transition-all disabled:opacity-50 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>{AI_OPERATION_COSTS.full_pipeline.energy}</span>
                    <Coins className="w-3 h-3 text-orange-500 ml-1" />
                    <span>{AI_OPERATION_COSTS.full_pipeline.coins}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Full Automation</h4>
                <p className="text-xs text-gray-600">Complete pipeline automation</p>
              </button>

              <button
                onClick={() => handleStartJob('follow_up')}
                disabled={loading}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1877F2] hover:bg-blue-50 transition-all disabled:opacity-50 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>{AI_OPERATION_COSTS.follow_up.energy}</span>
                    <Coins className="w-3 h-3 text-orange-500 ml-1" />
                    <span>{AI_OPERATION_COSTS.follow_up.coins}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Follow-Up</h4>
                <p className="text-xs text-gray-600">Send smart follow-ups</p>
              </button>

              <button
                onClick={() => handleStartJob('qualify')}
                disabled={loading}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1877F2] hover:bg-blue-50 transition-all disabled:opacity-50 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>{AI_OPERATION_COSTS.qualify.energy}</span>
                    <Coins className="w-3 h-3 text-orange-500 ml-1" />
                    <span>{AI_OPERATION_COSTS.qualify.coins}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Qualify</h4>
                <p className="text-xs text-gray-600">AI-powered qualification</p>
              </button>
            </div>
          </div>

          {/* Active Jobs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Jobs</h3>
            {activeJobs.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Bot className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No active automation jobs</p>
                <p className="text-xs text-gray-500 mt-1">Start an action above to automate your pipeline</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeJobs.map((job) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {getJobTypeLabel(job.job_type)}
                          </h4>
                          {getJobStatusBadge(job.status)}
                        </div>
                        <p className="text-xs text-gray-500">
                          Started {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {job.status === 'running' && (
                          <button
                            onClick={() => handlePauseJob(job.id)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Pause"
                          >
                            <Pause className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        {job.status === 'paused' && (
                          <button
                            onClick={() => handleResumeJob(job.id)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Resume"
                          >
                            <Play className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStopJob(job.id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Stop"
                        >
                          <Square className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span>{job.energy_cost} energy</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-orange-500" />
                        <span>{job.coin_cost} coins</span>
                      </div>
                    </div>

                    {job.status === 'running' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-[#1877F2] h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Facebook Style */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            AI operations use energy and coins from your account
          </p>
        </div>
      </div>
    </div>
  );
}
