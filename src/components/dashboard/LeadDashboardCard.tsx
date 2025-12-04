import React from 'react';
import type { LeadDashboardData } from '../../types/LeadDashboard';
import {
  temperatureColor,
  temperatureIcon,
  stageColor,
  stageEmoji,
  offerTypeColor,
  getNextAction,
  getUrgencyLevel,
  urgencyColor,
  formatRelativeTime,
  calculateConversionProbability
} from '../../utils/leadDashboardHelpers';

interface LeadDashboardCardProps {
  lead: LeadDashboardData;
  onViewDetails?: (sessionId: string) => void;
}

export function LeadDashboardCard({ lead, onViewDetails }: LeadDashboardCardProps) {
  const urgency = getUrgencyLevel(lead);
  const conversionProb = calculateConversionProbability(lead);
  const nextAction = getNextAction(lead);

  return (
    <div className="w-full bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">{lead.name}</h3>
          {lead.email && (
            <p className="text-sm text-gray-500">{lead.email}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatRelativeTime(lead.updatedAt)} • {lead.channel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${temperatureColor(lead.leadTemperature)}`}>
            {temperatureIcon(lead.leadTemperature)} {lead.leadTemperature.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            Score: <span className="font-bold">{lead.leadScore}/100</span>
          </span>
        </div>
      </div>

      {/* MESSAGE PREVIEW */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-700 text-sm italic line-clamp-2">
          "{lead.messagePreview}"
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Funnel Stage */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs text-gray-500 font-bold mb-1">Funnel Stage</h4>
          <div className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${stageColor(lead.funnelStage)}`}>
            {stageEmoji(lead.funnelStage)} {lead.funnelStage}
          </div>
        </div>

        {/* Last Intent */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs text-gray-500 font-bold mb-1">Last Intent</h4>
          <p className="text-sm font-medium text-gray-700 capitalize">
            {lead.lastIntent.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Message Count */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs text-gray-500 font-bold mb-1">Engagement</h4>
          <p className="text-sm font-medium text-gray-700">
            {lead.messageCount} messages
          </p>
        </div>

        {/* Conversion Probability */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs text-gray-500 font-bold mb-1">Conversion</h4>
          <p className="text-sm font-bold text-gray-900">
            {conversionProb}%
          </p>
        </div>
      </div>

      {/* BUYING SIGNALS */}
      {lead.buyingSignals && lead.buyingSignals.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs text-gray-500 font-bold mb-2">Buying Signals</h4>
          <div className="flex flex-wrap gap-2">
            {lead.buyingSignals.slice(0, 5).map((signal, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* OFFER SUGGESTION */}
      <div className={`mb-4 rounded-lg p-4 border-2 ${offerTypeColor(lead.offerSuggestion.type)}`}>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-bold">💡 AI Suggested Offer</h4>
          <span className="text-xs font-bold uppercase">
            {lead.offerSuggestion.type}
          </span>
        </div>

        {lead.offerSuggestion.fromProduct && lead.offerSuggestion.toProduct && (
          <p className="text-sm font-medium mb-2">
            {lead.offerSuggestion.fromProduct}
            {lead.offerSuggestion.fromPrice && ` (₱${lead.offerSuggestion.fromPrice})`}
            {' → '}
            <strong>{lead.offerSuggestion.toProduct}</strong>
            {lead.offerSuggestion.toPrice && ` (₱${lead.offerSuggestion.toPrice})`}
          </p>
        )}

        <p className="text-sm leading-relaxed line-clamp-3">
          {lead.offerSuggestion.message}
        </p>
      </div>

      {/* RECOMMENDED NEXT ACTION */}
      <div className={`rounded-lg p-4 border-2 ${urgencyColor(urgency)} mb-4`}>
        <h4 className="text-sm font-bold mb-2">
          {urgency === 'high' && '🚨 '} Next Action
        </h4>
        <p className="text-sm font-medium leading-relaxed">
          {nextAction}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails?.(lead.sessionId)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          View Chat
        </button>
        {urgency === 'high' && (
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Take Over
          </button>
        )}
      </div>
    </div>
  );
}
