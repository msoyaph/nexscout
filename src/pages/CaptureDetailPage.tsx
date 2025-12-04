import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Trash2, Edit3, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchBrowserCaptureById, deleteBrowserCapture, BrowserCapture } from '../services/browserCaptureService';
import { supabase } from '../lib/supabase';
import CaptureTag from '../components/capture/CaptureTag';
import CaptureTabs from '../components/capture/CaptureTabs';

interface CaptureDetailPageProps {
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

export default function CaptureDetailPage({ captureId, onBack, onNavigate }: CaptureDetailPageProps) {
  const { profile } = useAuth();
  const [capture, setCapture] = useState<BrowserCapture | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCapture();
  }, [captureId]);

  async function loadCapture() {
    setLoading(true);
    try {
      const data = await fetchBrowserCaptureById(captureId);
      setCapture(data);
      setNotes(data?.notes || '');
    } catch (error) {
      console.error('Failed to load capture:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNotes() {
    if (!capture) return;

    try {
      const { error } = await supabase
        .from('browser_captures')
        .update({ notes })
        .eq('id', captureId)
        .eq('user_id', profile?.id);

      if (error) throw error;

      setCapture({ ...capture, notes });
      setEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const success = await deleteBrowserCapture(captureId);
      if (success) {
        onBack();
      } else {
        alert('Failed to delete capture');
      }
    } catch (error) {
      console.error('Failed to delete capture:', error);
      alert('Failed to delete capture');
    } finally {
      setDeleting(false);
    }
  }

  function handleUseForScan() {
    onNavigate('scan-processing', {
      sourceType: 'browser_extension',
      captureId: captureId,
    });
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
    }).format(date);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading capture...</p>
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
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="size-5" />
            <span className="font-semibold">Back</span>
          </button>
        </div>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <AlertCircle className="size-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Capture Not Found</h3>
            <p className="text-gray-600">This capture may have been deleted or you don't have access to it.</p>
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
          <span className="font-semibold">Back to My Captures</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Capture Details</h1>
            <p className="text-blue-100 text-sm">Captured on {formatDate(capture.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
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

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Capture Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Platform</p>
                  <p className="font-semibold text-gray-900 capitalize">{capture.platform}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capture Type</p>
                  <p className="font-semibold text-gray-900">{capture.capture_type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date/Time</p>
                  <p className="font-semibold text-gray-900 text-sm">{formatDate(capture.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Extension Version</p>
                  <p className="font-semibold text-gray-900">{capture.extension_version || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Source URL</p>
                  <a
                    href={capture.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    <ExternalLink className="size-4 shrink-0" />
                    Open Link
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Tags</h2>
              {capture.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {capture.tags.map((tag, idx) => (
                    <CaptureTag key={idx} tag={tag} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No tags</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Notes</h2>
                <button
                  onClick={() => setEditingNotes(!editingNotes)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit3 className="size-4" />
                </button>
              </div>
              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNotes}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNotes(capture.notes || '');
                        setEditingNotes(false);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {capture.notes || <span className="text-gray-400 italic">No notes yet</span>}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleUseForScan}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2"
              >
                <Sparkles className="size-5" />
                Use for Smart Scan
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full px-6 py-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 className="size-5" />
                Delete Capture
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <CaptureTabs
              textContent={capture.text_content}
              htmlSnapshot={capture.html_snapshot}
              metadata={capture.metadata}
            />
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Capture?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete this capture. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
