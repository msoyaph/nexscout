import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Building2, Tag, FileText, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EditProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: string;
  onProspectUpdated: () => void;
}

export default function EditProspectModal({
  isOpen,
  onClose,
  prospectId,
  onProspectUpdated
}: EditProspectModalProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && prospectId) {
      loadProspect();
    }
  }, [isOpen, prospectId]);

  const loadProspect = async () => {
    setInitialLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          position: data.position || '',
          tags: (data.metadata?.tags || []).join(', '),
          notes: data.bio_text || data.metadata?.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading prospect:', error);
      alert('Failed to load prospect details.');
    } finally {
      setInitialLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

      // Build update data
      const updateData: any = {
        full_name: formData.full_name.trim(),
        bio_text: formData.notes.trim() || null,
        metadata: {
          tags: tagArray,
          notes: formData.notes.trim()
        }
      };

      // Add optional fields
      if (formData.email.trim()) updateData.email = formData.email.trim();
      if (formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.company.trim()) updateData.company = formData.company.trim();
      if (formData.position.trim()) updateData.position = formData.position.trim();

      console.log('Updating prospect:', updateData);

      const { data, error } = await supabase
        .from('prospects')
        .update(updateData)
        .eq('id', prospectId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Prospect updated successfully:', data);

      // Close modal first
      onClose();

      // Then notify parent
      setTimeout(() => {
        onProspectUpdated();
      }, 100);

    } catch (error: any) {
      console.error('Error updating prospect:', error);
      const errorMessage = error?.message || 'Failed to update prospect. Please try again.';
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
          <h2 className="text-lg font-bold text-white">Edit Prospect</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        {initialLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
          </form>
        )}

        {/* Footer */}
        {!initialLoading && (
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
              onClick={handleSubmit}
              disabled={loading || !formData.full_name}
              className="flex-1 px-4 py-2.5 bg-[#1877F2] text-white rounded-lg font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
