import { useEffect, useState } from 'react';
import { Globe, Check, X, Loader } from 'lucide-react';
import { companyWebCrawlerPipeline, CrawlProgressEvent } from '../services/companyWebCrawlerPipeline';
import { companyBrainSync } from '../services/companyBrainSync';
import { useAuth } from '../contexts/AuthContext';

interface CompanyWebsiteScrapeProgressProps {
  url: string;
  tier?: string;
  companyId?: string;
  onComplete?: (success: boolean, data?: any) => void;
  autoStart?: boolean;
}

export default function CompanyWebsiteScrapeProgress({
  url,
  tier = 'free',
  companyId,
  onComplete,
  autoStart = false,
}: CompanyWebsiteScrapeProgressProps) {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const stepMessages: { [key: string]: string } = {
    validating: 'Validating website URL',
    fetching: 'Fetching website',
    scraping: 'Scraping content',
    extracting: 'Extracting company information',
    analyzing: 'Detecting brand elements',
    embedding: 'Generating embeddings',
    syncing: 'Building company AI brain',
    completed: 'Crawl completed!',
    failed: 'Crawl failed',
  };

  useEffect(() => {
    if (autoStart && url && user) {
      startCrawl();
    }
  }, [autoStart, url, user]);

  const startCrawl = async () => {
    if (!user || !url) return;

    setIsRunning(true);
    setStatus('running');
    setProgress(0);
    setErrorMessage('');

    try {
      const result = await companyWebCrawlerPipeline.crawlWebsite(
        user.id,
        url,
        tier,
        companyId,
        (event: CrawlProgressEvent) => {
          setProgress(event.progress);
          setCurrentStep(event.step);
          setCurrentMessage(event.message);
        }
      );

      if (result.success && result.data && result.extractedDataId) {
        await companyBrainSync.syncAfterCrawl(
          user.id,
          companyId,
          result.extractedDataId,
          result.data
        );

        setStatus('success');
        setProgress(100);
        if (onComplete) onComplete(true, result.data);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to crawl website');
        if (onComplete) onComplete(false);
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
      if (onComplete) onComplete(false);
    } finally {
      setIsRunning(false);
    }
  };

  if (status === 'idle') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">AI Website Crawl</h3>
            <p className="text-sm text-gray-600">
              Scan your website to power up your AI brain
            </p>
          </div>
        </div>

        <button
          onClick={startCrawl}
          disabled={!url}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start AI Crawl
        </button>

        {tier === 'free' && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Free tier: 1 page • Pro: 3 pages • Elite: 10 pages
          </p>
        )}
      </div>
    );
  }

  if (status === 'running') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">AI Reading Your Company...</h3>
            <p className="text-sm text-gray-600">{currentMessage}</p>
          </div>
        </div>

        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-2">
          {Object.entries(stepMessages).slice(0, -2).map(([step, label]) => (
            <div
              key={step}
              className={`flex items-center gap-2 text-sm ${
                currentStep === step
                  ? 'text-blue-600 font-semibold'
                  : progress > getStepProgress(step)
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {progress > getStepProgress(step) ? (
                <Check className="w-4 h-4" />
              ) : currentStep === step ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
              )}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Crawl Completed!</h3>
            <p className="text-sm text-gray-600">
              Your AI brain has been updated with fresh company data
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">AI Readiness</span>
            <span className="font-bold text-green-600">Increased</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Brand Elements</span>
            <span className="font-bold text-blue-600">Extracted</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Embeddings</span>
            <span className="font-bold text-purple-600">Generated</span>
          </div>
        </div>

        <button
          onClick={() => {
            setStatus('idle');
            setProgress(0);
          }}
          className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Crawl Again
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Crawl Failed</h3>
            <p className="text-sm text-gray-600">{errorMessage}</p>
          </div>
        </div>

        <button
          onClick={startCrawl}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Retry Crawl
        </button>
      </div>
    );
  }

  return null;
}

function getStepProgress(step: string): number {
  const steps: { [key: string]: number } = {
    validating: 0,
    fetching: 10,
    scraping: 30,
    extracting: 50,
    analyzing: 70,
    embedding: 85,
    syncing: 90,
    completed: 100,
  };
  return steps[step] || 0;
}
