/**
 * ScoutScore Debug Panel
 * Main component for displaying transparent scoring breakdown across v1-v8
 */
import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, TestTube, User, Target, MessageSquare, Sparkles } from "lucide-react";
import type { ScoutScoreDebug, LeadTemperature } from "../../lib/types/scoutScoreDebug";
import { getScoutScoreDebug } from "../../lib/api/getScoutScoreDebug";
import { HeatMeter } from "./HeatMeter";
import { ScoreLayerCard } from "./ScoreLayerCard";
import { EmotionGauge } from "./EmotionGauge";
import { TimelineBar } from "./TimelineBar";

interface ScoutScoreDebugPanelProps {
  leadId: string;
  testMode?: boolean;
  onClose?: () => void;
}

function getTempBadgeClasses(temp: LeadTemperature): string {
  if (temp === "hot") return "bg-gradient-to-r from-red-500 to-red-600 text-white";
  if (temp === "warm") return "bg-gradient-to-r from-orange-500 to-orange-600 text-white";
  return "bg-gradient-to-r from-sky-500 to-sky-600 text-white";
}

function getIndustryLabel(industry: string): string {
  return industry
    .replace("_", " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Mock data for test mode
const mockDebugData: ScoutScoreDebug = {
  leadId: "lead_mock_123",
  leadName: "Juan Dela Cruz",
  finalScore: 82,
  leadTemperature: "hot",
  industry: "mlm",
  intentSignal: "product_and_income_interest",
  conversionLikelihood: 78,
  recommendedCTA: "Invite to starter package with COD + brief business overview",
  versions: {
    v1: {
      score: 70,
      signals: ["asked price", "asked about benefits"],
      explanation: "Basic text shows interest in product and pricing.",
    },
    v2: {
      score: 60,
      objections: ["budget", "need_to_think"],
      sensitivityLevel: "medium",
      explanation: "Budget concern but open to hearing options.",
    },
    v3: {
      score: 85,
      interactions: ["clicked_product_link", "opened_pricing_page"],
      clickHeat: 90,
      explanation: "Strong click behavior on product and pricing links.",
    },
    v4: {
      score: 75,
      timelineStrength: 80,
      momentum: "warming",
      daysSilent: 1,
      explanation: "Recent engagement, trending upward.",
    },
    v5: {
      score: 80,
      industryMatch: "MLM / Direct Selling",
      weightProfile: "mlm_default",
      explanation: "Language matches MLM buyer persona and opportunity interest.",
    },
    v6: {
      score: 78,
      personaFit: "aspiring_side_hustler",
      mismatchReasons: [],
      explanation: "Looks like a side-hustle seeker with wellness interest.",
    },
    v7: {
      score: 72,
      ctaRecommendation: "Offer starter pack with light business invite",
      ctaFitScore: 72,
      explanation: "CTA fits warm-to-hot MLM lead.",
    },
    v8: {
      score: 65,
      emotionalTone: "hopeful",
      confidence: 65,
      dominantSignal: "wants better health + extra income",
      explanation: "Positive tone with slight hesitation about money.",
    },
  },
};

export const ScoutScoreDebugPanel: React.FC<ScoutScoreDebugPanelProps> = ({
  leadId,
  testMode = false,
  onClose,
}) => {
  const [data, setData] = useState<ScoutScoreDebug | null>(testMode ? mockDebugData : null);
  const [loading, setLoading] = useState(!testMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (testMode) return;

    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const result = await getScoutScoreDebug(leadId);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load ScoutScore debug data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [leadId, testMode]);

  if (loading && !data) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm text-slate-600">Loading ScoutScore debug data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Error loading debug data</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const tempBadge = getTempBadgeClasses(data.leadTemperature);
  const finalScore = Math.max(0, Math.min(100, data.finalScore));
  const industry = getIndustryLabel(data.industry);

  // Industry-aware label adjustments
  const getObjectionLabel = (obj: string, industry: string): string => {
    if (industry === "Insurance" && obj === "budget") return "Premium Affordability";
    if (industry === "Insurance" && obj === "timing") return "Policy Activation Timing";
    if (industry === "Real Estate" && obj.includes("call")) return "Schedule Viewing";
    if (industry === "Ecommerce" && obj === "budget") return "Price Concern";
    if (industry === "Ecommerce" && obj === "shipping") return "Shipping Concern";
    return obj;
  };

  const getCTALabel = (cta: string, industry: string): string => {
    if (industry === "Real Estate" && cta.includes("Book Call")) {
      return cta.replace("Book Call", "Schedule Viewing");
    }
    return cta;
  };

  // Filter MLM-only signals for non-MLM industries
  const filterSignals = (signals: string[], industry: string): string[] => {
    if (industry === "MLM") return signals;
    
    const mlmOnlySignals = ['upline', 'binary', 'downline', 'team_building', 'recruit'];
    return signals.filter(signal => 
      !mlmOnlySignals.some(mlmSignal => signal.toLowerCase().includes(mlmSignal))
    );
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 md:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">
                ScoutScore Debug Analysis
              </h2>
              {data.leadName && (
                <p className="text-sm text-slate-600 mt-0.5">{data.leadName}</p>
              )}
            </div>
          </div>
        </div>
        {testMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded-lg">
            <TestTube className="w-4 h-4 text-yellow-700" />
            <span className="text-xs font-semibold text-yellow-800">Test Mode</span>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Top Section: Lead Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Lead Info */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                Lead ID
              </span>
              <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {data.leadId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                Industry
              </span>
              <span className="text-xs font-semibold text-slate-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {industry}
              </span>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${tempBadge} shadow-sm`}
            >
              {data.leadTemperature.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium block mb-1">
                Intent Signal
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {data.intentSignal || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium block mb-1">
                Conversion Likelihood
              </span>
              <span className="text-sm font-bold text-blue-600">
                {data.conversionLikelihood.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Heat Meter + CTA */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <HeatMeter score={finalScore} />
          
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                Recommended CTA
              </span>
            </div>
            <div className="text-xs text-slate-800 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
              {getCTALabel(data.recommendedCTA || "No CTA recommendation available.", industry)}
            </div>
          </div>
        </div>
      </div>

      {/* Emotional + Timeline Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <EmotionGauge
            confidence={data.versions.v8.confidence}
            emotionalTone={data.versions.v8.emotionalTone}
            dominantSignal={data.versions.v8.dominantSignal}
          />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <TimelineBar
            daysSilent={data.versions.v4.daysSilent}
            timelineStrength={data.versions.v4.timelineStrength}
            momentum={data.versions.v4.momentum}
          />
        </div>
      </div>

      {/* Version Cards Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Version Breakdown
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* v1 */}
          <ScoreLayerCard
            version="v1"
            title="Basic Reply Scoring"
            score={data.versions.v1.score}
            summary={data.versions.v1.explanation}
            tags={filterSignals(data.versions.v1.signals, industry)}
          />

          {/* v2 */}
          <ScoreLayerCard
            version="v2"
            title="Objection Sensitivity"
            score={data.versions.v2.score}
            summary={data.versions.v2.explanation}
            tags={data.versions.v2.objections.map(obj => getObjectionLabel(obj, industry))}
          >
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500">
                Sensitivity level:{" "}
                <span className="font-semibold text-slate-800 capitalize">
                  {data.versions.v2.sensitivityLevel}
                </span>
              </p>
              {data.versions.v2.objections.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Detected objections:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                    {data.versions.v2.objections.map((obj, idx) => (
                      <li key={idx} className="capitalize">{getObjectionLabel(obj, industry)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScoreLayerCard>

          {/* v3 */}
          <ScoreLayerCard
            version="v3"
            title="CTA / Click Signals"
            score={data.versions.v3.score}
            summary={data.versions.v3.explanation}
            tags={filterSignals(data.versions.v3.interactions, industry)}
          >
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500">
                Click heat:{" "}
                <span className="font-semibold text-slate-800">
                  {data.versions.v3.clickHeat.toFixed(0)} / 100
                </span>
              </p>
              {data.versions.v3.interactions.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Interactions:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                    {data.versions.v3.interactions.map((interaction, idx) => (
                      <li key={idx} className="capitalize">{interaction.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScoreLayerCard>

          {/* v4 */}
          <ScoreLayerCard
            version="v4"
            title="Lead Maturity & Timeline"
            score={data.versions.v4.score}
            summary={data.versions.v4.explanation}
          >
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500">
                Timeline strength:{" "}
                <span className="font-semibold text-slate-800">
                  {data.versions.v4.timelineStrength.toFixed(0)} / 100
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                Momentum:{" "}
                <span className="font-semibold text-slate-800 capitalize">
                  {data.versions.v4.momentum}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                Days since last interaction:{" "}
                <span className={`font-semibold ${data.versions.v4.daysSilent > 7 ? 'text-red-600' : data.versions.v4.daysSilent > 3 ? 'text-orange-600' : 'text-slate-800'}`}>
                  {data.versions.v4.daysSilent}
                </span>
              </p>
            </div>
          </ScoreLayerCard>

          {/* v5 */}
          <ScoreLayerCard
            version="v5"
            title="Industry Logic Match"
            score={data.versions.v5.score}
            summary={data.versions.v5.explanation}
          >
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500">
                Industry match:{" "}
                <span className="font-semibold text-slate-800">
                  {data.versions.v5.industryMatch}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                Weight profile:{" "}
                <span className="font-semibold text-slate-800">
                  {data.versions.v5.weightProfile}
                </span>
              </p>
            </div>
          </ScoreLayerCard>

          {/* v6 */}
          <ScoreLayerCard
            version="v6"
            title="Persona Fit"
            score={data.versions.v6.score}
            summary={data.versions.v6.explanation}
            tags={[data.versions.v6.personaFit]}
          >
            {data.versions.v6.mismatchReasons.length > 0 && (
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Mismatch reasons:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                  {data.versions.v6.mismatchReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </ScoreLayerCard>

          {/* v7 */}
          <ScoreLayerCard
            version="v7"
            title="CTA Fit & Recommendation"
            score={data.versions.v7.score}
            summary={data.versions.v7.explanation}
          >
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500">
                CTA Fit Score:{" "}
                <span className="font-semibold text-slate-800">
                  {data.versions.v7.ctaFitScore.toFixed(0)} / 100
                </span>
              </p>
              <div className="pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">Suggested CTA:</span>
                <p className="text-[11px] font-medium text-slate-800">
                  {getCTALabel(data.versions.v7.ctaRecommendation, industry)}
                </p>
              </div>
            </div>
          </ScoreLayerCard>

          {/* v8 */}
          <ScoreLayerCard
            version="v8"
            title="Emotional Intelligence Layer"
            score={data.versions.v8.score}
            summary={data.versions.v8.explanation}
          >
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500">
                Emotional tone:{" "}
                <span className="font-semibold text-slate-800 capitalize">
                  {data.versions.v8.emotionalTone}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                Confidence:{" "}
                <span className="font-semibold text-slate-800">
                  {data.versions.v8.confidence.toFixed(0)} / 100
                </span>
              </p>
              <div className="pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block mb-1">Dominant signal:</span>
                <p className="text-[11px] font-medium text-slate-800">
                  {data.versions.v8.dominantSignal}
                </p>
              </div>
            </div>
          </ScoreLayerCard>
        </div>
      </div>

      {testMode && (
        <div className="text-xs text-slate-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <TestTube className="w-4 h-4 text-yellow-600" />
          <span className="italic">Test Mode: Showing mock ScoutScore debug data.</span>
        </div>
      )}
    </div>
  );
};


