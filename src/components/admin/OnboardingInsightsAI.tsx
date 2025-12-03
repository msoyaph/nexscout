import { useState } from 'react';
import { Sparkles, RefreshCw, Download, AlertCircle } from 'lucide-react';

interface OnboardingInsightsAIProps {
  analytics: any;
}

export function OnboardingInsightsAI({ analytics }: OnboardingInsightsAIProps) {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sequenceOutput, setSequenceOutput] = useState('');

  async function generateInsights() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/onboarding/analyze', {
        method: 'POST',
        body: JSON.stringify({ analytics }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setOutput(data.text || 'No insights generated');
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights');
      console.error('Error generating insights:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateSequence() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/onboarding/generate-sequence', {
        method: 'POST',
        body: JSON.stringify({ analytics }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to generate sequence');
      }

      const data = await response.json();
      setSequenceOutput(data.sequence || '{}');
    } catch (err: any) {
      setError(err.message || 'Failed to generate sequence');
      console.error('Error generating sequence:', err);
    } finally {
      setLoading(false);
    }
  }

  function downloadSequence() {
    const blob = new Blob([sequenceOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'onboarding_v3_dynamic.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const criticalSteps = analytics?.weakSteps?.filter(
    (s: any) => s.severity === 'critical'
  ).length || 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Onboarding GPT Insights
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered optimization recommendations based on funnel analytics
          </p>
        </div>
        {criticalSteps > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">{criticalSteps} Critical Issues</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Funnel Analysis & Recommendations
            </h3>
            <button
              onClick={generateInsights}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Insights
                </>
              )}
            </button>
          </div>

          <textarea
            value={output}
            placeholder="Click 'Generate Insights' to analyze your onboarding funnel and get AI-powered recommendations..."
            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            readOnly
          />

          {output && (
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Generate Optimized Sequence v3
            </h3>
            <button
              onClick={generateSequence}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Sequence
                </>
              )}
            </button>
          </div>

          <textarea
            value={sequenceOutput}
            placeholder="Click 'Generate Sequence' to create an AI-optimized onboarding sequence based on your data..."
            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly
          />

          {sequenceOutput && (
            <div className="flex gap-2">
              <button
                onClick={downloadSequence}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(sequenceOutput)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy JSON
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Weak Steps Detected</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.weakSteps?.length || 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Critical Issues</p>
          <p className="text-2xl font-bold text-red-600">{criticalSteps}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg Success Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {analytics?.sequenceHealth?.[0]?.avg_success_rate?.toFixed(1) ||
              '0'}
            %
          </p>
        </div>
      </div>
    </div>
  );
}
