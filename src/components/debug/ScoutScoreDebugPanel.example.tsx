/**
 * Example usage of ScoutScoreDebugPanel
 * 
 * This file demonstrates how to use the debug panel in different scenarios
 */

import React, { useState } from 'react';
import { ScoutScoreDebugPanel } from './ScoutScoreDebugPanel';

// Example 1: In a modal
export function ScoutScoreDebugModal({ leadId, isOpen, onClose }: {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <ScoutScoreDebugPanel leadId={leadId} onClose={onClose} />
      </div>
    </div>
  );
}

// Example 2: In a page
export function LeadDebugPage({ leadId }: { leadId: string }) {
  const [testMode, setTestMode] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">ScoutScore Debug View</h1>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="rounded border-slate-300"
            />
            Test Mode (Mock Data)
          </label>
        </div>
        <ScoutScoreDebugPanel leadId={leadId} testMode={testMode} />
      </div>
    </div>
  );
}

// Example 3: Embedded in ProspectDetailPage
export function ProspectDetailWithDebug({ prospectId }: { prospectId: string }) {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div>
      {/* Your existing prospect detail UI */}
      
      {/* Debug toggle button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {showDebug ? 'Hide' : 'Show'} Debug View
      </button>

      {/* Debug panel */}
      {showDebug && (
        <div className="mt-6">
          <ScoutScoreDebugPanel leadId={prospectId} testMode={false} />
        </div>
      )}
    </div>
  );
}


