import { useEffect, useState } from 'react';
import { Monitor, RefreshCw, Eye, Trash2, CheckCircle, Clock, Facebook, Instagram, Linkedin, Twitter, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BrowserCaptureIngestor } from '../services/browserCaptureIngestor';

interface BrowserCapturPageProps {
  onNavigate: (page: string) => void;
}

interface CaptureEvent {
  id: string;
  capture_type: string;
  platform: string;
  source_url: string;
  text_content: string;
  html_snapshot: string;
  processed: boolean;
  created_at: string;
  processed_at?: string;
}

export default function BrowserCapturePage({ onNavigate }: BrowserCapturPageProps) {
  const [events, setEvents] = useState<CaptureEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CaptureEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('browser_capture_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessEvent = async (eventId: string) => {
    setProcessing(eventId);
    try {
      const result = await BrowserCaptureIngestor.processEvent(eventId);
      alert(`Processing complete! ${result.contactsAdded} contacts added, ${result.interactionsAdded} interactions recorded.`);
      await loadEvents();
    } catch (error) {
      console.error('Failed to process event:', error);
      alert('Failed to process event. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessAll = async () => {
    setProcessing('all');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await BrowserCaptureIngestor.processAllUnprocessed(user.id);
      alert(
        `Batch processing complete!\n${result.eventsProcessed} events processed\n${result.totalContacts} contacts added\n${result.totalInteractions} interactions recorded`
      );
      await loadEvents();
    } catch (error) {
      console.error('Failed to batch process:', error);
      alert('Failed to process events. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this capture? This cannot be undone.')) return;

    try {
      await supabase.from('browser_capture_events').delete().eq('id', eventId);
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event.');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'tiktok': return Video;
      default: return Monitor;
    }
  };

  const getCaptureTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const unprocessedCount = events.filter(e => !e.processed).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading captures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browser Captures</h1>
            <p className="text-gray-600">Manage your captured social media data</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadEvents}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {unprocessedCount > 0 && (
              <button
                onClick={handleProcessAll}
                disabled={processing === 'all'}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${processing === 'all' ? 'animate-spin' : ''}`} />
                Process All ({unprocessedCount})
              </button>
            )}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Captures Yet</h2>
            <p className="text-gray-600 mb-6">
              Install the NexScout browser extension to start capturing social media data
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const Icon = getPlatformIcon(event.platform);
              const isProcessing = processing === event.id;

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {getCaptureTypeLabel(event.capture_type)}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">{event.platform}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {event.processed ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Processed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{event.source_url}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {event.text_content.substring(0, 150)}
                      {event.text_content.length > 150 ? '...' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setViewingEvent(event)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Raw Text
                    </button>

                    {!event.processed && (
                      <button
                        onClick={() => handleProcessEvent(event.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        {isProcessing ? 'Processing...' : 'Process Now'}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Raw Text Content</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getCaptureTypeLabel(viewingEvent.capture_type)} from {viewingEvent.platform}
                </p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-xl">
                  {viewingEvent.text_content}
                </pre>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setViewingEvent(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
