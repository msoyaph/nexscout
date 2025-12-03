/**
 * Real-Time Government Monitor
 * Live WebSocket dashboard showing engine activity
 */

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Activity, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import {
  getRecentEngineEvents,
  getQueueLength,
  calculateEngineMetrics,
} from '../../../government/realtime/broadcastEngineEvent';

interface EngineEvent {
  id: string;
  engine_id: string;
  event_type: string;
  job_id?: string;
  payload?: any;
  created_at: string;
}

export default function RealtimeMonitorPage({ onBack }: { onBack?: () => void }) {
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [queueLength, setQueueLength] = useState(0);
  const [engineMetrics, setEngineMetrics] = useState<Record<string, any>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadInitialData();

    const channel = supabase
      .channel('realtime-engine-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'realtime_engine_events',
        },
        (payload: any) => {
          console.log('[RealtimeMonitor] New event:', payload);
          if (payload.new) {
            setEvents((prev) => [payload.new, ...prev].slice(0, 100));
            updateEngineMetrics(payload.new.engine_id);
          }
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeMonitor] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    const queueInterval = setInterval(async () => {
      const count = await getQueueLength();
      setQueueLength(count);
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(queueInterval);
    };
  }, []);

  async function loadInitialData() {
    const recentEvents = await getRecentEngineEvents(50);
    setEvents(recentEvents);

    const count = await getQueueLength();
    setQueueLength(count);

    const uniqueEngines = [...new Set(recentEvents.map((e) => e.engine_id))];
    for (const engineId of uniqueEngines) {
      updateEngineMetrics(engineId);
    }
  }

  async function updateEngineMetrics(engineId: string) {
    const metrics = await calculateEngineMetrics(engineId, 5);
    if (metrics) {
      setEngineMetrics((prev) => ({ ...prev, [engineId]: metrics }));
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'STARTED':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'QUEUED':
        return <Activity className="w-4 h-4 text-gray-500" />;
      default:
        return <Zap className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'STARTED':
        return 'bg-blue-50 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-50 border-green-200';
      case 'FAILED':
        return 'bg-red-50 border-red-200';
      case 'QUEUED':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Real-Time Monitor</h1>
            <p className="text-gray-600 mt-1">Live engine activity and performance metrics</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">WebSocket Status</p>
                <p className="text-2xl font-bold mt-1">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Queue Length</p>
                <p className="text-2xl font-bold mt-1">{queueLength}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Engines</p>
                <p className="text-2xl font-bold mt-1">
                  {Object.keys(engineMetrics).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {Object.keys(engineMetrics).length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-bold mb-4">Engine Metrics (Last 5 min)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(engineMetrics).map(([engineId, metrics]: [string, any]) => (
                <div key={engineId} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2">{engineId}</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Jobs:</span>
                      <span className="font-medium">{metrics.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium text-green-600">
                        {metrics.successRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Error Rate:</span>
                      <span className="font-medium text-red-600">
                        {metrics.errorRate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold">Live Event Stream</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing last {events.length} events
            </p>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Waiting for events...</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getEventColor(
                    event.event_type
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getEventIcon(event.event_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{event.engine_id}</span>
                        <span className="text-xs text-gray-500">→</span>
                        <span className="text-sm font-medium">{event.event_type}</span>
                      </div>
                      {event.job_id && (
                        <p className="text-xs text-gray-600 mt-1">Job: {event.job_id}</p>
                      )}
                      {event.payload && Object.keys(event.payload).length > 0 && (
                        <pre className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
