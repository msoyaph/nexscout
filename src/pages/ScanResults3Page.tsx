import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { supabase } from '../lib/supabase';
import ScanSummaryHeader from '../components/results/ScanSummaryHeader';
import PipelineVisualizerV3 from '../components/results/PipelineVisualizerV3';
import AIInsightsDashboard from '../components/results/AIInsightsDashboard';
import ProspectListV3 from '../components/results/ProspectListV3';
import ProspectDetailDrawer from '../components/results/ProspectDetailDrawer';
import FloatingActionBubble from '../components/results/FloatingActionBubble';

interface ScanResults3PageProps {
  scanId: string;
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function ScanResults3Page({ scanId, onBack, onNavigate }: ScanResults3PageProps) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const [scan, setScan] = useState<any>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState('COMPLETED');
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('scan_results_3_viewed', { scanId });
    loadScanData();
    pollScanStatus();
  }, [scanId]);

  const loadScanData = async () => {
    try {
      const { data: scanData } = await supabase
        .from('scans')
        .select('*')
        .eq('id', scanId)
        .single();

      if (scanData) {
        setScan(scanData);
      }

      const { data: items } = await supabase
        .from('scan_processed_items')
        .select('*')
        .eq('scan_id', scanId)
        .order('score', { ascending: false });

      if (items) {
        setProspects(
          items.map((item) => ({
            id: item.id,
            name: item.name,
            score: item.score || 50,
            rank: item.score >= 70 ? 'hot' : item.score >= 50 ? 'warm' : 'cold',
            summary: item.content || 'No summary available',
            tags: item.metadata?.keywords || item.metadata?.signals || [],
            metadata: item.metadata,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading scan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollScanStatus = async () => {
    const interval = setInterval(async () => {
      const { data: status } = await supabase
        .from('scan_status')
        .select('*')
        .eq('scan_id', scanId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (status) {
        setCurrentStep(status.step);

        if (status.step === 'COMPLETED' || status.step === 'FAILED') {
          clearInterval(interval);
          loadScanData();
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const handleViewRawData = () => {
    trackEvent('view_raw_data_clicked', { scanId });
    onNavigate('admin-data-fusion', { scanId });
  };

  const handleProspectClick = (prospect: any) => {
    trackEvent('prospect_clicked', { prospectId: prospect.id, scanId });
    setSelectedProspect(prospect);
  };

  const handleGenerateMessage = (prospect: any) => {
    trackEvent('generate_message_clicked', { prospectId: prospect.id, scanId });
    onNavigate('messaging-hub', { prospectName: prospect.name });
  };

  const handleGenerateDeck = (prospect: any) => {
    trackEvent('generate_deck_clicked', { prospectId: prospect.id, scanId });
    onNavigate('ai-pitch-deck', { prospectName: prospect.name });
  };

  const handleAddToPipeline = async (prospect: any) => {
    trackEvent('add_to_pipeline_clicked', { prospectId: prospect.id, scanId });
  };

  const handleAddNotes = (prospect: any) => {
    trackEvent('add_notes_clicked', { prospectId: prospect.id, scanId });
  };

  const handleExport = (prospect: any) => {
    trackEvent('export_prospect_clicked', { prospectId: prospect.id, scanId });
  };

  const handleBlastMessage = () => {
    trackEvent('blast_message_clicked', { scanId });
    onNavigate('messaging-hub', { scanId });
  };

  const handleBatchDeck = () => {
    trackEvent('batch_deck_clicked', { scanId });
    onNavigate('ai-pitch-deck', { scanId });
  };

  const handleExportLeads = () => {
    trackEvent('export_leads_clicked', { scanId });

    const csv = [
      ['Name', 'Score', 'Rank', 'Tags'].join(','),
      ...prospects.map((p) => [p.name, p.score, p.rank, p.tags.join(';')].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexscout-scan-${scanId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveScan = async () => {
    trackEvent('save_scan_clicked', { scanId });

    try {
      await supabase.from('scans').update({ saved: true }).eq('id', scanId);

      onNavigate('scan-library');
    } catch (error) {
      console.error('Error saving scan:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#65676B]">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#050505] mb-4">Scan Not Found</h2>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#1877F2] text-white rounded-xl font-semibold hover:bg-[#166FE5] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const insights = {
    topHotProspects: prospects.filter((p) => p.rank === 'hot').slice(0, 3),
    commonInterests: Array.from(
      new Set(prospects.flatMap((p) => p.tags).filter(Boolean))
    ).slice(0, 6),
    intentSignals: ['Extra income interest', 'Business opportunity seeker', 'Insurance awareness', 'Financial planning'],
    engagementPatterns: ['Active on LinkedIn', 'Responds to messages', 'Shares business content'],
    personaClusters: [
      { label: 'Entrepreneurs', count: Math.floor(prospects.length * 0.3) },
      { label: 'OFW', count: Math.floor(prospects.length * 0.25) },
      { label: 'Professionals', count: Math.floor(prospects.length * 0.45) },
    ],
    aiStrategy:
      'Recommended approach: Lead with value proposition about passive income opportunities. Use Taglish messaging for better engagement. Focus on hot leads first with personalized pitch decks.',
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24">
      <div className="bg-white border-b border-[#E4E6EB] sticky top-0 z-10">
        <div className="max-w-[620px] mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#050505]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#050505]">Scan Results 3.0</h1>
            <p className="text-sm text-[#65676B]">NexScout Core AI Engine 2.0</p>
          </div>
        </div>
      </div>

      <ScanSummaryHeader
        totalProspects={prospects.length}
        hotLeads={scan.hot_leads || 0}
        warmLeads={scan.warm_leads || 0}
        coldLeads={scan.cold_leads || 0}
        sourceType={scan.sources?.type || 'unknown'}
        timestamp={scan.created_at}
        onViewRawData={handleViewRawData}
      />

      <div className="max-w-[620px] mx-auto px-4 py-4 space-y-4">
        {scan.status === 'processing' && <PipelineVisualizerV3 currentStep={currentStep} />}

        {scan.status === 'completed' && (
          <>
            <AIInsightsDashboard {...insights} />

            <ProspectListV3
              prospects={prospects}
              onProspectClick={handleProspectClick}
              onMessage={handleGenerateMessage}
              onDeck={handleGenerateDeck}
              onPipeline={handleAddToPipeline}
              onNotes={handleAddNotes}
            />
          </>
        )}
      </div>

      <ProspectDetailDrawer
        prospect={selectedProspect}
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        onGenerateMessage={() => handleGenerateMessage(selectedProspect)}
        onGenerateDeck={() => handleGenerateDeck(selectedProspect)}
        onAddToPipeline={() => handleAddToPipeline(selectedProspect)}
        onAddNotes={() => handleAddNotes(selectedProspect)}
        onExport={() => handleExport(selectedProspect)}
      />

      <FloatingActionBubble
        onBlastMessage={handleBlastMessage}
        onBatchDeck={handleBatchDeck}
        onExportLeads={handleExportLeads}
        onSaveScan={handleSaveScan}
      />
    </div>
  );
}
