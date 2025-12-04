import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Share2, RefreshCw, Plus, Trash2, Edit3, Globe, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { libraryService, MessageSequence } from '../services/libraryService';
import { followUpSequencer } from '../services/ai/followUpSequencer';

interface MessageSequenceEditorPageProps {
  sequenceId: string;
  onBack: () => void;
}

export default function MessageSequenceEditorPage({ sequenceId, onBack }: MessageSequenceEditorPageProps) {
  const { user } = useAuth();
  const [sequence, setSequence] = useState<MessageSequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);

  useEffect(() => {
    loadSequence();
  }, [sequenceId]);

  const loadSequence = async () => {
    try {
      const data = await libraryService.getMessageSequence(sequenceId);
      if (data) {
        setSequence(data);
        setTitle(data.title);
      }
    } catch (error) {
      console.error('Error loading sequence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sequence) return;

    setSaving(true);
    try {
      await libraryService.updateMessageSequence(sequenceId, {
        title,
        messages: sequence.messages,
        status: 'active',
      });
      alert('Message sequence saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save message sequence');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!sequence || !user) return;

    if (customPrompt.trim()) {
      setShowPromptModal(false);
    }

    setRegenerating(true);
    try {
      await libraryService.updateMessageSequence(sequenceId, { status: 'generating' });

      const newSequence = await followUpSequencer.generateSequence({
        userId: user.id,
        prospectId: '',
        prospectName: sequence.prospect_name || 'Prospect',
        sequenceType: sequence.sequence_type as any,
        goal: 'recruit',
        tone: sequence.tone as any,
        industry: 'mlm',
        customPrompt: customPrompt || undefined,
      });

      await libraryService.updateMessageSequence(sequenceId, {
        messages: newSequence.steps,
        status: 'active',
      });

      loadSequence();
      setCustomPrompt('');
      alert('Message sequence regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating:', error);
      alert('Failed to regenerate message sequence');
    } finally {
      setRegenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      const token = await libraryService.generateShareToken('message_sequence', sequenceId);
      const url = libraryService.getShareUrl('message_sequence', token);
      setShareUrl(url);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    }
  };

  const handleDownload = () => {
    if (!sequence) return;

    const dataStr = JSON.stringify(sequence.messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sequence.title.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyMessageToClipboard = (message: string) => {
    navigator.clipboard.writeText(message);
    alert('Message copied to clipboard!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const updateMessage = (index: number, newContent: string) => {
    if (!sequence) return;

    const updatedMessages = [...sequence.messages];
    updatedMessages[index] = { ...updatedMessages[index], message: newContent };
    setSequence({ ...sequence, messages: updatedMessages });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading message sequence...</p>
        </div>
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Message sequence not found</p>
      </div>
    );
  }

  const messages = sequence.messages || [];

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
                  className="text-xl font-bold text-slate-900 border-b-2 border-purple-500 focus:outline-none"
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
        <div className="space-y-4">
          {messages.map((msg: any, index: number) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center size-10 rounded-lg bg-purple-100 text-purple-600 font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Day {msg.day || index + 1} - {msg.subject || 'Follow-up Message'}
                    </h3>
                    <p className="text-sm text-slate-500">{msg.timing || 'Send anytime'}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyMessageToClipboard(msg.message || msg.content)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  <Copy className="size-4" />
                  Copy
                </button>
              </div>

              {editingMessageIndex === index ? (
                <div>
                  <textarea
                    value={msg.message || msg.content}
                    onChange={(e) => updateMessage(index, e.target.value)}
                    className="w-full h-40 p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setEditingMessageIndex(null)}
                      className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => {
                        loadSequence();
                        setEditingMessageIndex(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {msg.message || msg.content}
                  </p>
                  <button
                    onClick={() => setEditingMessageIndex(index)}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
                  >
                    <Edit3 className="size-4" />
                    Edit Message
                  </button>
                </div>
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
                Provide additional instructions to customize how the message sequence is regenerated.
              </p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Make it more personal, add more urgency, focus on specific benefits..."
                className="w-full h-32 p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
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
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Share Message Sequence</h2>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="size-5 text-green-500" />
                  <span className="font-medium text-slate-900">Public Link</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">Anyone with this link can view the message sequence</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
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
