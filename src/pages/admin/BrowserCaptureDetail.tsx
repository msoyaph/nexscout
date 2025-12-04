import { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, Globe, Tag, FileText, Code, Download } from 'lucide-react';
import { fetchBrowserCaptureById, BrowserCapture } from '../../services/browserCaptureService';

interface BrowserCaptureDetailProps {
  captureId: string;
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-500 text-white',
  instagram: 'bg-pink-500 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-sky-500 text-white',
  tiktok: 'bg-black text-white',
  other: 'bg-gray-500 text-white',
};

export default function BrowserCaptureDetail({
  captureId,
  onBack,
  onNavigate,
}: BrowserCaptureDetailProps) {
  const [capture, setCapture] = useState<BrowserCapture | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'text' | 'html' | 'ai'>('text');

  useEffect(() => {
    loadCapture();
  }, [captureId]);

  async function loadCapture() {
    setLoading(true);
    try {
      const data = await fetchBrowserCaptureById(captureId);
      setCapture(data);
    } catch (error) {
      console.error('Failed to load capture:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  function downloadJSON() {
    if (!capture) return;

    const dataStr = JSON.stringify(capture, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `capture-${capture.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading capture details...</p>
        </div>
      </div>
    );
  }

  if (!capture) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="size-5" />
            <span className="font-semibold">Back</span>
          </button>
          <h1 className="text-3xl font-bold">Capture Not Found</h1>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">The requested capture could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="size-5" />
          <span className="font-semibold">Back to All Captures</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Browser Capture Details</h1>
            <p className="text-blue-100">ID: {capture.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                PLATFORM_COLORS[capture.platform] || PLATFORM_COLORS.other
              }`}
            >
              {capture.platform.toUpperCase()}
            </span>
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium">
              {capture.capture_type.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="size-5" />
                Capture Info
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-semibold text-gray-900">
                    {capture.profiles?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">{capture.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Platform</p>
                  <p className="font-semibold text-gray-900 capitalize">{capture.platform}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capture Type</p>
                  <p className="font-semibold text-gray-900">
                    {capture.capture_type.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date/Time</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatDate(capture.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Extension Version</p>
                  <p className="font-semibold text-gray-900">
                    {capture.extension_version || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Source URL</p>
                  <a
                    href={capture.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    {capture.source_url}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="size-5" />
                Tags
              </h2>
              {capture.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {capture.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No tags assigned</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="size-5" />
                Notes
              </h2>
              {capture.notes ? (
                <p className="text-gray-700 text-sm">{capture.notes}</p>
              ) : (
                <p className="text-gray-500 text-sm italic">No notes provided</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="size-5" />
                Metadata
              </h2>
              {Object.keys(capture.metadata).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(capture.metadata).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-600">{key}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No metadata</p>
              )}
            </div>

            <button
              onClick={downloadJSON}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="size-5" />
              Export JSON
            </button>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                      activeTab === 'text'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                        : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Text Content
                  </button>
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                      activeTab === 'html'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                        : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    HTML Snapshot
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                      activeTab === 'ai'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                        : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    AI Interpretation
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'text' && (
                  <div>
                    {capture.text_content ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            {capture.text_content.length.toLocaleString()} characters
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-[800px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                            {capture.text_content}
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
                    {capture.html_snapshot ? (
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> Large raw HTML – for debugging only.
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            {capture.html_snapshot.length.toLocaleString()} characters
                          </p>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-6 max-h-[800px] overflow-y-auto">
                          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                            {capture.html_snapshot}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-12">No HTML snapshot available</p>
                    )}
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="text-center py-12">
                    <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
                      <Globe className="size-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        AI Interpretation Coming Soon
                      </h3>
                      <p className="text-gray-600">
                        In the future, this will show AI-extracted prospects, signals, and insights
                        from the captured data.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
