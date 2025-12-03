import { useState } from 'react';
import { X, User, Mail, Phone, Building2, Tag, FileText, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddProspectManuallyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProspectAdded: () => void;
}

export default function AddProspectManuallyModal({
  isOpen,
  onClose,
  onProspectAdded
}: AddProspectManuallyModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    tags: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      console.error('No user found');
      alert('You must be logged in to add prospects.');
      return;
    }

    if (!formData.full_name.trim()) {
      alert('Please enter a name for the prospect.');
      return;
    }

    setLoading(true);
    try {
      // Parse tags
      const tagArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Generate a unique username for manual entries
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const username = `manual_${timestamp}_${randomStr}`;

      // Create prospect with only required fields and available data
      const prospectData: any = {
        user_id: user.id,
        full_name: formData.full_name.trim(),
        username: username,
        platform: 'manual',
        pipeline_stage: 'prospect',
        is_unlocked: true,
        metadata: {
          tags: tagArray,
          scout_score: 50,
          temperature: 'warm',
          manually_added: true,
          added_at: new Date().toISOString()
        }
      };

      // Add optional fields only if they have values
      if (formData.email.trim()) prospectData.email = formData.email.trim();
      if (formData.phone.trim()) prospectData.phone = formData.phone.trim();
      if (formData.company.trim()) prospectData.company = formData.company.trim();
      if (formData.position.trim()) prospectData.position = formData.position.trim();
      if (formData.notes.trim()) prospectData.bio_text = formData.notes.trim();

      console.log('Inserting prospect:', prospectData);

      const { data, error } = await supabase
        .from('prospects')
        .insert(prospectData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Prospect added successfully:', data);

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        tags: '',
        notes: ''
      });

      // Close modal first
      onClose();

      // Then notify parent and show success
      setTimeout(() => {
        onProspectAdded();
      }, 100);

    } catch (error: any) {
      console.error('Error adding prospect:', error);
      const errorMessage = error?.message || 'Failed to add prospect. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#1877F2] to-[#0E5FCC]">
          <h2 className="text-lg font-bold text-white">Add Prospect Manually</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 text-[#1877F2]" />
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-[#1877F2]" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-[#1877F2]" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all"
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Company */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 text-[#1877F2]" />
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all"
                placeholder="Acme Inc."
              />
            </div>

            {/* Position */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 text-[#1877F2]" />
                Position
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all"
                placeholder="CEO, Marketing Manager, etc."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Tag className="w-4 h-4 text-[#1877F2]" />
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all"
                placeholder="networking event, referral, linkedin"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-[#1877F2]" />
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all resize-none"
                placeholder="Met at conference, interested in our product..."
              />
            </div>
          </div>

          {/* Footer - Now inside form */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.full_name.trim()}
              className="flex-1 px-4 py-2.5 bg-[#1877F2] text-white rounded-lg font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Add Prospect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
