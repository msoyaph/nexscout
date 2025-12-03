import { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, TrendingUp, Send, MoreVertical, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProspectActionsMenuProps {
  prospectId: string;
  prospectName: string;
  onDelete: () => void;
  onEdit: () => void;
  onMoveToPipeline: () => void;
  onAutoFollowUp: () => void;
}

export default function ProspectActionsMenu({
  prospectId,
  prospectName,
  onDelete,
  onEdit,
  onMoveToPipeline,
  onAutoFollowUp
}: ProspectActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', prospectId);

      if (error) throw error;

      onDelete();
      setIsOpen(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting prospect:', error);
      alert('Failed to delete prospect. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveToPipeline = async () => {
    try {
      const { error } = await supabase
        .from('prospects')
        .update({ pipeline_stage: 'qualified' })
        .eq('id', prospectId);

      if (error) throw error;

      onMoveToPipeline();
      setIsOpen(false);
    } catch (error) {
      console.error('Error moving to pipeline:', error);
      alert('Failed to move to pipeline. Please try again.');
    }
  };

  const handleAutoFollowUp = () => {
    onAutoFollowUp();
    setIsOpen(false);
  };

  const handleEdit = () => {
    onEdit();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-8 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
          >
            <Edit className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Edit Prospect</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMoveToPipeline();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
          >
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Move to Pipeline</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAutoFollowUp();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
          >
            <Send className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Auto Smart Follow-up</span>
          </button>

          <div className="h-px bg-gray-200 my-2" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-600">Delete Prospect</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Delete Prospect?</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <span className="font-semibold">{prospectName}</span>? This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
