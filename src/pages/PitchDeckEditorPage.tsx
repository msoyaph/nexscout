import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Share2, RefreshCw, Plus, Trash2, Edit3, Eye, Lock, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { libraryService, PitchDeck } from '../services/libraryService';
import { pitchDeckGenerator } from '../services/ai/pitchDeckGenerator';

interface PitchDeckEditorPageProps {
  deckId: string;
  onBack: () => void;
}

export default function PitchDeckEditorPage({ deckId, onBack }: PitchDeckEditorPageProps) {
  const { user } = useAuth();
  const [deck, setDeck] = useState<PitchDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    loadDeck();
  }, [deckId]);

  const loadDeck = async () => {
    try {
      const data = await libraryService.getPitchDeck(deckId);
      if (data) {
        setDeck(data);
        setTitle(data.title);
      }
    } catch (error) {
      console.error('Error loading deck:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!deck) return;

    setSaving(true);
    try {
      await libraryService.updatePitchDeck(deckId, {
        title,
        content: deck.content,
        status: 'completed',
      });
      alert('Pitch deck saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save pitch deck');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!deck || !user) return;

    if (customPrompt.trim()) {
      setShowPromptModal(false);
    }

    setRegenerating(true);
    try {
      await libraryService.updatePitchDeck(deckId, { status: 'generating' });

      const newDeck = await pitchDeckGenerator.generateDeck({
        userId: user.id,
        prospectId: '',
        companyName: deck.company_name || 'Company',
        industry: deck.industry || 'general',
        goal: 'recruit',
        tone: 'professional',
        customPrompt: customPrompt || undefined,
      });

      await libraryService.updatePitchDeck(deckId, {
        content: { slides: newDeck.slides },
        status: 'completed',
      });

      loadDeck();
      setCustomPrompt('');
      alert('Pitch deck regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating:', error);
      alert('Failed to regenerate pitch deck');
    } finally {
      setRegenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      const token = await libraryService.generateShareToken('pitch_deck', deckId);
      const url = libraryService.getShareUrl('pitch_deck', token);
      setShareUrl(url);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    }
  };

  const handleDownload = () => {
    if (!deck) return;

    const dataStr = JSON.stringify(deck.content, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deck.title.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading pitch deck...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Pitch deck not found</p>
      </div>
    );
  }

  const slides = deck.content?.slides || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="size-5 text-slate-600" />
              </button>
              {editingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                  className="text-xl font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="p-1 rounded hover:bg-slate-100"
                  >
                    <Edit3 className="size-4 text-slate-400" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPromptModal(true)}
                disabled={regenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${regenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Share2 className="size-4" />
                Share
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-700 transition-colors"
              >
                <Download className="size-4" />
                Download
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="size-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {slides.map((slide: any, index: number) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center justify-center size-8 rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">{slide.title}</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{slide.content}</p>
                </div>
              </div>

              {slide.bulletPoints && slide.bulletPoints.length > 0 && (
                <ul className="mt-4 space-y-2 pl-4">
                  {slide.bulletPoints.map((point: string, i: number) => (
                    <li key={i} className="text-slate-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-1.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {showPromptModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowPromptModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Add Custom Prompt</h2>
              <p className="text-slate-600 mb-4">
                Provide additional instructions to customize how the pitch deck is regenerated.
              </p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Focus more on benefits, use more statistics, make it more casual..."
                className="w-full h-32 p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showShareModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowShareModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Share Pitch Deck</h2>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="size-5 text-green-500" />
                  <span className="font-medium text-slate-900">Public Link</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">Anyone with this link can view the pitch deck</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
