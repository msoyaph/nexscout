import { useEffect, useState } from 'react';
import { ArrowLeft, Loader, CheckCircle } from 'lucide-react';

interface DeepScanV3PageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

interface ScanEvent {
  state: string;
  label: string;
  progress: number;
  timestamp: string;
}

export default function DeepScanV3Page({ onBack }: DeepScanV3PageProps) {
  const [scanId, setScanId] = useState<string>('');
  const [label, setLabel] = useState<string>('Ready to scan');
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [events, setEvents] = useState<ScanEvent[]>([]);

  useEffect(() => {
    if (!scanId) return;

    // Simulate WebSocket connection for real-time updates
    const interval = setInterval(() => {
      // This would be replaced with actual WebSocket listener
      // For now, simulating progress updates
    }, 1000);

    return () => clearInterval(interval);
  }, [scanId]);

  const startTestScan = async () => {
    try {
      setLabel('Initializing scan...');
      setProgress(5);

      // Import the deep scan services
      const { startDeepScanV3 } = await import('../services/deepScan/deepScanEngineV3');
      const { subscribeToDeepScan } = await import('../services/deepScan/deepScanWebSocket');
      const { supabase } = await import('../lib/supabase');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLabel('Please log in to use Deep Scan');
        return;
      }

      // Start the deep scan in background
      const scanResult = await startDeepScanV3({
        userId: user.id,
        sourceType: 'paste_text',
        rawPayload: {
          text: 'Juan Dela Cruz, OFW sa Dubai, naghahanap ng extra income. Contact: 09171234567\nMaria Santos, entrepreneur, interested in business opportunities. Email: maria@example.com\nPedro Reyes, looking for side hustle, Dubai based. Phone: 09187654321'
        }
      });

      setScanId(scanResult.sessionId);

      // Subscribe to real-time updates
      const wsClient = await subscribeToDeepScan(scanResult.sessionId, user.id, {
        onEvent: (event) => {
          setEvents(prev => [...prev, {
            state: event.stage.toUpperCase(),
            label: event.message,
            progress: event.progress,
            timestamp: event.created_at
          }]);
        },
        onStatusUpdate: (status) => {
          setLabel(status.current_stage || 'Processing...');
          setProgress(status.progress || 0);

          if (status.status === 'complete') {
            setCompleted(true);
            wsClient.disconnect();
          } else if (status.status === 'failed') {
            setLabel(status.error_message || 'Scan failed');
            wsClient.disconnect();
          }
        }
      });

    } catch (error: any) {
      console.error('Failed to start scan:', error);
      setLabel(error.message || 'Scan failed - please try again');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deep Scan 3.0</h1>
              <p className="text-sm text-gray-500">Real-time multi-stage prospect intelligence</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Progress Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <span className="text-sm font-semibold text-blue-600">{progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {scanId ? (
            <div className="pt-2">
              <p className="text-xs text-gray-500">Scan ID: <span className="font-mono">{scanId}</span></p>
            </div>
          ) : (
            <button
              onClick={startTestScan}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
            >
              Start Test Scan
            </button>
          )}
        </div>

        {/* Completion Message */}
        {completed && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-green-800 font-semibold">Scan Completed Successfully!</p>
                <p className="text-sm text-green-600">All prospects have been analyzed and scored.</p>
              </div>
            </div>
          </div>
        )}

        {/* Event Timeline */}
        {events.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 px-1">Scan Timeline</h3>
            <div className="space-y-2">
              {events.map((ev, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-slide-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{ev.label}</p>
                      <p className="text-xs text-gray-500 mt-1">State: <span className="font-mono">{ev.state}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">{ev.progress}%</p>
                      <p className="text-xs text-gray-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">About Deep Scan 3.0</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Real-time WebSocket progress updates</li>
            <li>• Multi-stage processing pipeline (11 states)</li>
            <li>• ScoutScore v10 with personalized weights</li>
            <li>• Machine learning weight updates based on outcomes</li>
            <li>• Deep AI intelligence on every prospect</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ScoutScore v10 Math + Personalized Weights
export function computeScoutScoreV10(
  features: Record<string, number>,
  userWeights: Record<string, number>
): number {
  const base =
    (features.intent_strength || 0) * 0.25 +
    (features.buying_power || 0) * 0.2 +
    (features.emotional_fit || 0) * 0.15 +
    (features.relationship_closeness || 0) * 0.15 +
    (features.need_urgency || 0) * 0.15 +
    (features.digital_presence || 0) * 0.1;

  const personalized = Object.keys(userWeights).reduce((acc, key) => {
    return acc + (features[key] || 0) * userWeights[key];
  }, 0);

  return Math.min(100, Math.round(base + personalized));
}

export function updateUserWeightsOnOutcome(
  userWeights: Record<string, number>,
  outcome: 'closed' | 'ignored',
  features: Record<string, number>
): Record<string, number> {
  const lr = 0.05; // Learning rate
  const updated = { ...userWeights };

  Object.keys(features).forEach((k) => {
    if (outcome === 'closed') {
      updated[k] = (updated[k] || 0) + lr * features[k];
    } else if (outcome === 'ignored') {
      updated[k] = (updated[k] || 0) - lr * features[k];
    }
  });

  return updated;
}
