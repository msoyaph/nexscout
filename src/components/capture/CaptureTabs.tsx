import { useState } from 'react';
import { FileText, Code, Sparkles } from 'lucide-react';

interface CaptureTabsProps {
  textContent: string | null;
  htmlSnapshot: string | null;
  metadata: any;
}

export default function CaptureTabs({ textContent, htmlSnapshot, metadata }: CaptureTabsProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'html' | 'metadata' | 'ai'>('text');

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="size-4" />
            Text Content
          </button>
          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'html'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="size-4" />
            HTML Snapshot
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'metadata'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="size-4" />
            Metadata
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="size-4" />
            AI Interpretation
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'text' && (
          <div>
            {textContent ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {textContent.length.toLocaleString()} characters
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {textContent}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No text content available</p>
            )}
          </div>
        )}

        {activeTab === 'html' && (
          <div>
            {htmlSnapshot ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Large raw HTML – for debugging and AI analysis.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {htmlSnapshot.length.toLocaleString()} characters
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {htmlSnapshot}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No HTML snapshot available</p>
            )}
          </div>
        )}

        {activeTab === 'metadata' && (
          <div>
            {metadata && Object.keys(metadata).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">{key}</p>
                    <p className="text-sm text-gray-900 font-mono">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">No metadata available</p>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="text-center py-12">
            <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
              <Sparkles className="size-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Interpretation Coming Soon</h3>
              <p className="text-gray-600">
                Future AI analysis will extract prospects, identify pain points, and suggest outreach
                strategies from your captured data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
