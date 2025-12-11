/**
 * AI SYSTEM INSTRUCTIONS EDITOR
 * 
 * Locked Spacing Plain Text Editor for AI System Instructions
 * Preserves exact whitespace, blank lines, and formatting
 * 
 * Features:
 * - Plain text input (no markdown conversion)
 * - Exact whitespace preservation
 * - Magic button for AI improvement
 * - Undo functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Wand2, RotateCcw, Sparkles, Upload, X, FileText, Image as ImageIcon, Music, Video, File, Eye, Download, AlertCircle, HelpCircle, ChevronDown, ChevronUp, Type, FileCode, MessageSquare, Target, Link, Package, Edit } from 'lucide-react';
import { useInstructionsTransformation } from '../../hooks/useInstructionsTransformation';
import { uploadMediaFile, deleteMediaFile, formatFileSize, type MediaFileType } from '../../lib/uploadMediaFile';
import { instructionsTransformationEngine } from '../../services/ai/instructionsTransformationEngine';
import CoinPurchaseModal from '../CoinPurchaseModal';
import { getIndustryTemplate, getIndustryOptions, type IndustryType } from '../../data/industryTemplates';
import { tonePresets, salesScripts, objectionResponses, ctaCollections, toneBoosters, type TonePreset } from '../../data/presetCollections';
import PresetModal, { type PresetItem } from './PresetModal';
import './editor-styles.css';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  path?: string; // Storage path for deletion
  type: 'image' | 'pdf' | 'audio' | 'video' | 'document' | 'product' | 'other';
  size?: number; // Optional for products (no file upload)
  uploadedAt: string;
  // Product-specific fields
  description?: string; // Product description
  productLink?: string; // Product link/URL
  // File-specific fields
  fileType?: 'brochure' | 'pdf' | 'document' | 'other'; // For files (brochures, etc.)
  displayName?: string; // Display name for files
}

export interface AiSystemInstructionsEditorProps {
  value: string; // Plain text string
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  userId?: string; // Optional: for organizing uploads
  attachments?: Attachment[]; // Optional: initial attachments
  onAttachmentsChange?: (attachments: Attachment[]) => void; // Callback when attachments change
}

/**
 * Convert HTML to plain text while preserving spacing
 * CRITICAL: Do NOT normalize or collapse whitespace
 */
function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  // If it's already plain text (no HTML tags), return as-is
  if (!html.includes('<') || !html.includes('>')) {
    return html;
  }
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Walk through DOM nodes to preserve structure
  let text = '';
  
  function walkNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Add line breaks for block elements
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tagName)) {
        if (text && !text.endsWith('\n')) {
          text += '\n';
        }
      }
      
      // Handle list items
      if (tagName === 'li') {
        text += '- ';
      }
      
      // Handle line breaks
      if (tagName === 'br') {
        text += '\n';
      }
      
      // Recursively process children
      Array.from(node.childNodes).forEach(walkNode);
      
      // Add line break after block elements
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol'].includes(tagName)) {
        if (!text.endsWith('\n')) {
          text += '\n';
        }
      }
    }
  }
  
  walkNode(temp);
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Only trim leading/trailing whitespace, preserve internal spacing
  text = text.replace(/^\s+/, '').replace(/\s+$/, '');
  
  return text;
}

export default function AiSystemInstructionsEditor({
  value,
  onChange,
  label = 'AI System Instructions',
  helperText,
  disabled = false,
  placeholder = 'Write your AI system instructions here...',
  userId,
  attachments: initialAttachments = [],
  onAttachmentsChange
}: AiSystemInstructionsEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  
  // Sync external attachments prop
  useEffect(() => {
    if (initialAttachments && initialAttachments.length > 0) {
      setAttachments(initialAttachments);
    }
  }, [initialAttachments]);
  
  // Transformation engine
  const { improve, undo, isTransforming, error: transformError, canUndo } = useInstructionsTransformation(userId || '');
  const [showMagicAnimation, setShowMagicAnimation] = useState(false);
  const [transformErrorState, setTransformErrorState] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  
  // Industry selector
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | ''>('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  
  // Preset modals
  const [showToneModal, setShowToneModal] = useState(false);
  const [showToneBoostersModal, setShowToneBoostersModal] = useState(false);
  const [showSalesScriptsModal, setShowSalesScriptsModal] = useState(false);
  const [showObjectionsModal, setShowObjectionsModal] = useState(false);
  const [showCTAModal, setShowCTAModal] = useState(false);
  
  // Coin purchase modal
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  
  // Setup Guide accordion state (collapsed by default to save space)
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
  // Product and File modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showFileLinkModal, setShowFileLinkModal] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', link: '' });
  const [newFileLink, setNewFileLink] = useState({ fileType: 'brochure', url: '', displayName: '' });
  
  // Load usage count on mount
  useEffect(() => {
    if (userId) {
      const count = instructionsTransformationEngine.getUsageCount(userId);
      setUsageCount(count);
    }
  }, [userId]);
  
  // Sync transform error from hook
  useEffect(() => {
    setTransformErrorState(transformError);
    
    // Show coin purchase modal if error is about insufficient coins
    if (transformError && (
      transformError.toLowerCase().includes('insufficient coins') ||
      transformError.toLowerCase().includes('insufficient energy') ||
      transformError.toLowerCase().includes('purchase more coins')
    )) {
      setShowCoinPurchaseModal(true);
    }
  }, [transformError]);
  
  // Convert HTML value to plain text on mount and when value changes
  useEffect(() => {
    if (value) {
      // Check if value is HTML or plain text
      const isHTML = value.includes('<') && value.includes('>');
      const plainText = isHTML ? htmlToPlainText(value) : value;
      setInternalValue(plainText);
    } else {
      setInternalValue('');
    }
  }, [value]);
  
  // Handle textarea change - preserve all whitespace
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Do NOT trim or sanitize - preserve all whitespace
    setInternalValue(newValue);
    onChange(newValue); // Pass plain text directly
  }, [onChange]);
  
  // Handle Magic button click
  const handleImprove = useCallback(async () => {
    if (!internalValue || internalValue.replace(/\s/g, '').length === 0) {
      setTransformErrorState('Please add some content before improving.');
      return;
    }
    
    setTransformErrorState(null);
    setShowMagicAnimation(true);
    
    try {
      const improved = await improve(internalValue);
      
      if (improved) {
        // Set improved text (preserve all whitespace)
        setInternalValue(improved);
        onChange(improved);
        
        // Update usage count
        if (userId) {
          const newCount = instructionsTransformationEngine.getUsageCount(userId);
          setUsageCount(newCount);
        }
        
        // Show success animation briefly, then keep button visible
        setTimeout(() => {
          setShowMagicAnimation(false);
        }, 2000);
      } else {
        setShowMagicAnimation(false);
        // Error message is already set by the improve function via transformError
        // The useEffect hook will handle showing the coin purchase modal
      }
    } catch (error) {
      console.error('Error improving instructions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to improve instructions';
      setTransformErrorState(errorMessage);
      
      // Check if error is about insufficient coins
      if (errorMessage.toLowerCase().includes('insufficient coins') ||
          errorMessage.toLowerCase().includes('insufficient energy') ||
          errorMessage.toLowerCase().includes('purchase more coins')) {
        setShowCoinPurchaseModal(true);
      }
      
      setShowMagicAnimation(false);
    }
  }, [internalValue, improve, onChange, transformError, userId]);
  
  // Handle Undo button click
  const handleUndo = useCallback(() => {
    const previous = undo();
    if (previous) {
      setInternalValue(previous);
      onChange(previous);
    }
  }, [undo, onChange]);
  
  // Determine file type from filename/extension
  const getFileType = (filename: string, mimeType?: string): Attachment['type'] => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    const pdfExts = ['pdf'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi'];
    const docExts = ['doc', 'docx', 'txt', 'rtf'];
    
    if (imageExts.includes(ext) || mimeType?.startsWith('image/')) return 'image';
    if (pdfExts.includes(ext) || mimeType === 'application/pdf') return 'pdf';
    if (audioExts.includes(ext) || mimeType?.startsWith('audio/')) return 'audio';
    if (videoExts.includes(ext) || mimeType?.startsWith('video/')) return 'video';
    if (docExts.includes(ext) || mimeType?.includes('document') || mimeType?.includes('text')) return 'document';
    return 'other';
  };
  
  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    
    try {
      // Validate file size (25MB max)
      const maxSize = 25 * 1024 * 1024; // 25MB in bytes
      if (file.size > maxSize) {
        throw new Error(`File is too large. Maximum allowed size is 25 MB. Your file is ${formatFileSize(file.size)}.`);
      }
      
      // Determine file type for upload
      const fileType = getFileType(file.name, file.type);
      let uploadType: MediaFileType = 'other';
      if (fileType === 'image') uploadType = 'image';
      else if (fileType === 'pdf') uploadType = 'pdf';
      else if (fileType === 'audio') uploadType = 'audio';
      else uploadType = 'other';
      
      // Upload file
      const result = await uploadMediaFile(file, uploadType, userId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.url) {
        // Add to attachments array (NOT to text editor)
        const newAttachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: result.url,
          path: result.path, // Store path for deletion
          type: fileType,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
        
        const updatedAttachments = [...attachments, newAttachment];
        setAttachments(updatedAttachments);
        
        // Notify parent component of attachment changes
        if (onAttachmentsChange) {
          onAttachmentsChange(updatedAttachments);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [userId]);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        handleFileUpload(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);
  
  // Remove attachment
  const handleRemoveAttachment = useCallback(async (id: string) => {
    const attachment = attachments.find(att => att.id === id);
    if (!attachment) return;
    
    // Delete from storage if path exists
    if (attachment.path) {
      try {
        const deleteResult = await deleteMediaFile(attachment.path);
        if (!deleteResult.success) {
          console.warn('[AiSystemInstructionsEditor] Failed to delete file from storage:', deleteResult.error);
          // Continue with removal from UI even if storage delete fails
        }
      } catch (error) {
        console.error('[AiSystemInstructionsEditor] Error deleting file:', error);
        // Continue with removal from UI
      }
    }
    
    const updatedAttachments = attachments.filter(att => att.id !== id);
    setAttachments(updatedAttachments);
    
    // Notify parent component of attachment changes
    if (onAttachmentsChange) {
      onAttachmentsChange(updatedAttachments);
    }
  }, [attachments, onAttachmentsChange]);
  
  // Get file icon based on type
  const getFileIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'product':
        return <Package className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };
  
  // Handle adding/editing product
  const handleSaveProduct = useCallback(() => {
    if (!newProduct.name || !newProduct.link) {
      setUploadError('Product name and link are required');
      return;
    }
    
    if (editingAttachment) {
      // Update existing product
      const updatedAttachments = attachments.map(att => 
        att.id === editingAttachment.id
          ? {
              ...att,
              name: newProduct.name,
              description: newProduct.description,
              url: newProduct.link,
              productLink: newProduct.link
            }
          : att
      );
      setAttachments(updatedAttachments);
      if (onAttachmentsChange) {
        onAttachmentsChange(updatedAttachments);
      }
    } else {
      // Add new product
      const productAttachment: Attachment = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newProduct.name,
        url: newProduct.link,
        type: 'product',
        description: newProduct.description,
        productLink: newProduct.link,
        uploadedAt: new Date().toISOString()
      };
      
      const updatedAttachments = [...attachments, productAttachment];
      setAttachments(updatedAttachments);
      if (onAttachmentsChange) {
        onAttachmentsChange(updatedAttachments);
      }
    }
    
    // Reset form
    setNewProduct({ name: '', description: '', link: '' });
    setEditingAttachment(null);
    setShowProductModal(false);
  }, [newProduct, editingAttachment, attachments, onAttachmentsChange]);
  
  // Handle adding/editing file link
  const handleSaveFileLink = useCallback(() => {
    if (!newFileLink.url || !newFileLink.displayName) {
      setUploadError('File URL and display name are required');
      return;
    }
    
    if (editingAttachment) {
      // Update existing file
      const updatedAttachments = attachments.map(att => 
        att.id === editingAttachment.id
          ? {
              ...att,
              name: newFileLink.displayName,
              url: newFileLink.url,
              fileType: newFileLink.fileType as 'brochure' | 'pdf' | 'document' | 'other',
              displayName: newFileLink.displayName
            }
          : att
      );
      setAttachments(updatedAttachments);
      if (onAttachmentsChange) {
        onAttachmentsChange(updatedAttachments);
      }
    } else {
      // Add new file
      const fileAttachment: Attachment = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newFileLink.displayName,
        url: newFileLink.url,
        type: 'other',
        fileType: newFileLink.fileType as 'brochure' | 'pdf' | 'document' | 'other',
        displayName: newFileLink.displayName,
        uploadedAt: new Date().toISOString()
      };
      
      const updatedAttachments = [...attachments, fileAttachment];
      setAttachments(updatedAttachments);
      if (onAttachmentsChange) {
        onAttachmentsChange(updatedAttachments);
      }
    }
    
    // Reset form
    setNewFileLink({ fileType: 'brochure', url: '', displayName: '' });
    setEditingAttachment(null);
    setShowFileLinkModal(false);
  }, [newFileLink, editingAttachment, attachments, onAttachmentsChange]);
  
  // Handle edit attachment
  const handleEditAttachment = useCallback((attachment: Attachment) => {
    if (attachment.type === 'product') {
      setNewProduct({
        name: attachment.name,
        description: attachment.description || '',
        link: attachment.productLink || attachment.url
      });
      setEditingAttachment(attachment);
      setShowProductModal(true);
    } else {
      setNewFileLink({
        fileType: (attachment.fileType || 'brochure') as 'brochure' | 'pdf' | 'document' | 'other',
        url: attachment.url,
        displayName: attachment.displayName || attachment.name
      });
      setEditingAttachment(attachment);
      setShowFileLinkModal(true);
    }
  }, []);
  
  // Handle industry selection
  const handleIndustrySelect = useCallback((industryId: IndustryType) => {
    const template = getIndustryTemplate(industryId);
    if (template) {
      setInternalValue(template);
      onChange(template);
      setSelectedIndustry(industryId);
      setShowIndustryDropdown(false);
    }
  }, [onChange]);
  
  // Insert text at cursor position (preserves spacing)
  const insertTextAtCursor = useCallback((textToInsert: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = internalValue;
    
    // Insert text with proper spacing
    const newText = 
      currentText.substring(0, start) + 
      '\n\n' + textToInsert + '\n\n' + 
      currentText.substring(end);
    
    setInternalValue(newText);
    onChange(newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + textToInsert.length + 4; // +4 for \n\n before and after
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [internalValue, onChange]);
  
  // Handle preset selection
  const handlePresetSelect = useCallback((content: string) => {
    insertTextAtCursor(content);
  }, [insertTextAtCursor]);
  
  // Get current industry for sales scripts
  const getCurrentIndustry = (): IndustryType | null => {
    if (selectedIndustry) return selectedIndustry as IndustryType;
    // Try to detect from content
    const content = internalValue.toLowerCase();
    if (content.includes('mlm') || content.includes('direct selling')) return 'mlm-direct-selling';
    if (content.includes('real estate') || content.includes('property')) return 'real-estate';
    if (content.includes('insurance')) return 'insurance';
    if (content.includes('clinic') || content.includes('medical')) return 'clinics-medical';
    if (content.includes('automotive') || content.includes('car') || content.includes('vehicle')) return 'automotive';
    if (content.includes('education') || content.includes('coaching')) return 'education-coaching';
    if (content.includes('e-commerce') || content.includes('online store')) return 'e-commerce';
    if (content.includes('franchise')) return 'franchise-dealership';
    if (content.includes('travel') || content.includes('visa')) return 'travel-visa';
    if (content.includes('loan') || content.includes('finance')) return 'finance-loans';
    if (content.includes('saas') || content.includes('software')) return 'saas-software-sales';
    return null;
  };
  
  // Prepare preset items for modals
  const getTonePresetItems = (): PresetItem[] => {
    return Object.values(tonePresets).map(preset => ({
      id: preset.id,
      title: preset.name,
      description: preset.description,
      content: preset.content
    }));
  };
  
  const getSalesScriptItems = (): PresetItem[] => {
    const industry = getCurrentIndustry();
    if (!industry) return [];
    
    return salesScripts[industry]?.map(script => ({
      id: script.id,
      title: script.title,
      content: script.content
    })) || [];
  };
  
  const getObjectionItems = (): PresetItem[] => {
    return objectionResponses.map(obj => ({
      id: obj.id,
      title: obj.objection,
      description: `Response for: ${obj.objection}`,
      content: obj.response
    }));
  };
  
  const getCTAItems = (): PresetItem[] => {
    return ctaCollections.map(cta => ({
      id: cta.id,
      title: cta.title,
      content: cta.content
    }));
  };
  
  const getToneBoosterItems = (): PresetItem[] => {
    return toneBoosters.map(booster => ({
      id: booster.id,
      title: booster.useCase,
      description: `Tone enhancement for: ${booster.useCase}`,
      content: booster.content
    }));
  };

  return (
    <>
      <div className="space-y-4">
        {/* Editor Section */}
        <div className="space-y-3">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        {/* Industry Selector */}
        {!disabled && (
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Select Your Business Category
            </label>
            <button
              type="button"
              onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
              className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span className={selectedIndustry ? 'text-gray-900' : 'text-gray-500'}>
                {selectedIndustry 
                  ? getIndustryOptions().find(opt => opt.value === selectedIndustry)?.label 
                  : 'Choose industry...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showIndustryDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Industry Dropdown */}
            {showIndustryDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowIndustryDropdown(false)}
                />
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {getIndustryOptions().map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleIndustrySelect(option.value)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Plain Text Editor with Locked Spacing */}
        <div className="relative">
        <textarea
          ref={textareaRef}
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          spellCheck={false}
          wrap="off"
          // NO maxLength - allow unlimited characters
          className="locked-spacing-editor w-full bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed resize-y"
          style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'system-ui, sans-serif',
            lineHeight: '1.45',
            tabSize: 4,
            padding: '14px',
            minHeight: '300px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}
        />
        
        {/* Magic & Undo Buttons - Floating at Bottom Right */}
        {!disabled && userId && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 z-50 pointer-events-none">
            {/* Undo Button */}
            {canUndo && (
              <button
                onClick={handleUndo}
                disabled={isTransforming}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group pointer-events-auto"
                title="Undo last transformation"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                <span className="text-xs font-medium hidden sm:inline">Undo</span>
              </button>
            )}
            
            {/* Magic Button - Always Visible with Stable Opacity */}
            <button
              onClick={handleImprove}
              disabled={isTransforming || !internalValue || internalValue.replace(/\s/g, '').length === 0}
              className={`relative p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all hover:scale-105 flex items-center gap-2 pointer-events-auto ${
                isTransforming ? 'cursor-wait loading-button' : 'hover:scale-105'
              } ${
                (!internalValue || internalValue.replace(/\s/g, '').length === 0) ? 'opacity-60 cursor-not-allowed' : 'opacity-100'
              }`}
              title={
                isTransforming 
                  ? "Generating improved instructions... Please wait" 
                  : usageCount === 0
                    ? "Improve formatting and structure (Free)"
                    : usageCount === 1
                      ? "Improve formatting and structure (8 coins required)"
                      : `Improve formatting and structure (8 coins - Generation #${usageCount + 1})`
              }
            >
              {/* Button Content - Always Visible */}
              <div className="flex items-center gap-2 relative z-10">
                {isTransforming ? (
                  <>
                    {/* Animated Spinner */}
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                    <span className="text-xs font-medium hidden sm:inline">Generating...</span>
                    <span className="text-xs font-medium sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium hidden sm:inline">Improve</span>
                  </>
                )}
              </div>
              
              {/* Shimmer Animation Overlay - Only when not transforming */}
              {!isTransforming && showMagicAnimation && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-lg pointer-events-none"></div>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {transformErrorState && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{transformErrorState}</span>
        </div>
      )}
      
        {/* Preset Buttons */}
        {!disabled && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowToneModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Type className="w-4 h-4" />
              <span>Tone Presets</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowToneBoostersModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tone Boosters</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowSalesScriptsModal(true)}
              disabled={!getCurrentIndustry()}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!getCurrentIndustry() ? 'Select an industry first' : 'Industry Sales Scripts'}
            >
              <FileCode className="w-4 h-4" />
              <span>Sales Scripts</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowObjectionsModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Objection Replies</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowCTAModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>CTA Collections</span>
            </button>
          </div>
        )}
        
        {/* Helper Text */}
        {helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
        
        {/* Attachments Panel - Separate from Text Editor */}
        {!disabled && (
          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
          {/* Header Section */}
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Products & Files</h3>
            <p className="text-xs sm:text-sm text-gray-500">Add products, brochures, and files for your chatbot to share</p>
          </div>
          
          {/* Action Buttons - Mobile-Friendly Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
            {/* Add Product Button */}
            <button
              type="button"
              onClick={() => {
                setEditingAttachment(null);
                setNewProduct({ name: '', description: '', link: '' });
                setShowProductModal(true);
              }}
              className="group relative flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 px-4 py-3 sm:py-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02]"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 sm:flex-none text-left sm:text-center">
                <span className="block text-sm sm:text-base font-semibold text-gray-900">Add Product</span>
                <span className="block text-xs text-gray-600 mt-0.5">With description & link</span>
              </div>
            </button>
            
            {/* Add File Link Button */}
            <button
              type="button"
              onClick={() => {
                setEditingAttachment(null);
                setNewFileLink({ fileType: 'brochure', url: '', displayName: '' });
                setShowFileLinkModal(true);
              }}
              className="group relative flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 px-4 py-3 sm:py-4 bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02]"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Link className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 sm:flex-none text-left sm:text-center">
                <span className="block text-sm sm:text-base font-semibold text-gray-900">Add File Link</span>
                <span className="block text-xs text-gray-600 mt-0.5">Brochures & documents</span>
              </div>
            </button>
            
            {/* Upload File Button */}
            <label className="cursor-pointer group">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.mp3,.wav,.mp4,.webm"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={uploading || disabled}
              />
              <div className="flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 px-4 py-3 sm:py-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 sm:flex-none text-left sm:text-center">
                  <span className="block text-sm sm:text-base font-semibold text-gray-900">Upload File</span>
                  <span className="block text-xs text-gray-600 mt-0.5">Images, PDFs, docs</span>
                </div>
              </div>
            </label>
          </div>
          
          {/* Upload Error */}
          {uploadError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {uploadError}
            </div>
          )}
          
          {/* Uploading Indicator */}
          {uploading && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading file...</span>
            </div>
          )}
          
          {/* Divider */}
          {attachments.length > 0 && (
            <div className="border-t border-gray-200 my-4"></div>
          )}
          
          {/* Attachments List */}
          {attachments.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No products or files yet</p>
              <p className="text-xs text-gray-500">Click the buttons above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`group flex items-center gap-4 p-4 bg-white border-2 rounded-xl hover:shadow-md transition-all duration-200 ${
                    attachment.type === 'product' 
                      ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-white hover:border-green-300' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Thumbnail/Icon */}
                  <div className="flex-shrink-0">
                    {attachment.type === 'image' ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-14 h-14 object-cover rounded-lg border-2 border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                        onClick={() => setPreviewAttachment(attachment)}
                      />
                    ) : (
                      <div className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 shadow-sm ${
                        attachment.type === 'product' 
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 text-green-700' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300 text-gray-600'
                      }`}>
                        {getFileIcon(attachment.type)}
                      </div>
                    )}
                  </div>
                  
                  {/* File/Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{attachment.name}</p>
                      {attachment.type === 'product' && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Product
                        </span>
                      )}
                      {attachment.fileType && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          {attachment.fileType}
                        </span>
                      )}
                    </div>
                    {attachment.type === 'product' && attachment.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{attachment.description}</p>
                    )}
                    {attachment.type === 'product' ? (
                      <a 
                        href={attachment.productLink || attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1.5 inline-flex items-center gap-1 truncate max-w-full"
                      >
                        <Link className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{attachment.productLink || attachment.url}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{attachment.size ? formatFileSize(attachment.size) : attachment.fileType || 'File'}</p>
                        {attachment.url && (
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                          >
                            <Link className="w-3 h-3" />
                            <span>View</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditAttachment(attachment)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {attachment.type !== 'product' && attachment.type !== 'other' && (
                      <button
                        onClick={() => setPreviewAttachment(attachment)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <a
                      href={attachment.url}
                      target={attachment.type === 'product' ? '_blank' : undefined}
                      rel={attachment.type === 'product' ? 'noopener noreferrer' : undefined}
                      download={attachment.type !== 'product' ? attachment.name : undefined}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title={attachment.type === 'product' ? 'Open Link' : 'Download'}
                    >
                      {attachment.type === 'product' ? <Link className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </a>
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}
        </div>
        
        {/* Help Sidebar - Bottom (Accordion) */}
        {!disabled && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Accordion Header */}
            <button
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Setup Guide & Tips</h3>
              </div>
              {showSetupGuide ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {/* Accordion Content */}
            {showSetupGuide && (
              <div className="px-4 pb-4 space-y-6 border-t border-gray-200 pt-4">
                {/* What You Can Edit */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">✅ Only Edit:</h4>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                    <li>Company info</li>
                    <li>Products & pricing</li>
                    <li>Tone personality</li>
                    <li>CTA wording</li>
                    <li>Booking links</li>
                  </ul>
                </div>
                
                {/* What NOT to Edit */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">❌ Do NOT Edit:</h4>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                    <li>Memory rules</li>
                    <li>Compliance blocks</li>
                    <li>Safety wording</li>
                    <li>Name/phone saving logic</li>
                  </ul>
                </div>
                
                {/* Writing Tips */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">✨ Writing Tips:</h4>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                    <li>Keep benefits short</li>
                    <li>Avoid long paragraphs</li>
                    <li>No hype guarantees</li>
                    <li>Use warm & simple delivery</li>
                  </ul>
                </div>
                
                {/* Best Performance */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">📊 Best Performance:</h4>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                    <li>2–4 sentence replies</li>
                    <li>1 question at a time</li>
                    <li>No pressure selling</li>
                  </ul>
                </div>
                
                {/* Sample Preview */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 Sample Format:</h4>
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded font-mono whitespace-pre-wrap">
{`TITLE

Content here
with spacing

- Bullet item
- Another item

NEXT SECTION

More content`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProductModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Add Product</h3>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
              <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g., Premium Soy Milk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Brief description of the product..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={newProduct.link}
                  onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })}
                  placeholder="https://example.com/product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={handleSaveProduct}
                  disabled={!newProduct.name || !newProduct.link}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                >
                  {editingAttachment ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setNewProduct({ name: '', description: '', link: '' });
                    setEditingAttachment(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add File Link Modal */}
      {showFileLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFileLinkModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Add File Link</h3>
              </div>
              <button
                onClick={() => setShowFileLinkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Type
                </label>
                <select
                  value={newFileLink.fileType}
                  onChange={(e) => setNewFileLink({ ...newFileLink, fileType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                >
                  <option value="brochure">Company Brochure</option>
                  <option value="pdf">PDF Document</option>
                  <option value="document">Document (DOC/DOCX)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={newFileLink.url}
                  onChange={(e) => setNewFileLink({ ...newFileLink, url: e.target.value })}
                  placeholder="https://example.com/brochure.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFileLink.displayName}
                  onChange={(e) => setNewFileLink({ ...newFileLink, displayName: e.target.value })}
                  placeholder="e.g., Company Brochure 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={handleSaveFileLink}
                  disabled={!newFileLink.url || !newFileLink.displayName}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                >
                  {editingAttachment ? 'Update File Link' : 'Add File Link'}
                </button>
                <button
                  onClick={() => {
                    setShowFileLinkModal(false);
                    setNewFileLink({ fileType: 'brochure', url: '', displayName: '' });
                    setEditingAttachment(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewAttachment(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{previewAttachment.name}</h3>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4">
              {previewAttachment.type === 'image' && (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-w-full h-auto rounded-lg"
                />
              )}
              
              {previewAttachment.type === 'pdf' && (
                <div className="w-full h-[600px]">
                  <iframe
                    src={previewAttachment.url}
                    className="w-full h-full border border-gray-200 rounded-lg"
                    title={previewAttachment.name}
                  />
                </div>
              )}
              
              {previewAttachment.type === 'audio' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Music className="w-16 h-16 text-blue-600" />
                  <audio controls src={previewAttachment.url} className="w-full max-w-md">
                    Your browser does not support the audio element.
                  </audio>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Audio
                  </a>
                </div>
              )}
              
              {previewAttachment.type === 'video' && (
                <div className="flex flex-col items-center gap-4">
                  <video controls src={previewAttachment.url} className="max-w-full rounded-lg">
                    Your browser does not support the video element.
                  </video>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Video
                  </a>
                </div>
              )}
              
              {(previewAttachment.type === 'document' || previewAttachment.type === 'other') && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <FileText className="w-16 h-16 text-gray-400" />
                  <p className="text-gray-600">Preview not available for this file type.</p>
                  <a
                    href={previewAttachment.url}
                    download={previewAttachment.name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Preset Modals */}
      <PresetModal
        isOpen={showToneModal}
        onClose={() => setShowToneModal(false)}
        title="Tone Presets"
        items={getTonePresetItems()}
        onSelect={handlePresetSelect}
      />
      
      <PresetModal
        isOpen={showToneBoostersModal}
        onClose={() => setShowToneBoostersModal(false)}
        title="Tone Boosters (Use-Case Specific)"
        items={getToneBoosterItems()}
        onSelect={handlePresetSelect}
      />
      
      <PresetModal
        isOpen={showSalesScriptsModal}
        onClose={() => setShowSalesScriptsModal(false)}
        title={`Sales Scripts - ${getCurrentIndustry() ? getIndustryOptions().find(opt => opt.value === getCurrentIndustry())?.label : 'Select Industry'}`}
        items={getSalesScriptItems()}
        onSelect={handlePresetSelect}
      />
      
      <PresetModal
        isOpen={showObjectionsModal}
        onClose={() => setShowObjectionsModal(false)}
        title="Objection Response Library"
        items={getObjectionItems()}
        onSelect={handlePresetSelect}
      />
      
      <PresetModal
        isOpen={showCTAModal}
        onClose={() => setShowCTAModal(false)}
        title="CTA Collections"
        items={getCTAItems()}
        onSelect={handlePresetSelect}
      />
      
      {/* Coin Purchase Modal */}
      <CoinPurchaseModal
        isOpen={showCoinPurchaseModal}
        onClose={() => {
          setShowCoinPurchaseModal(false);
          setTransformErrorState(null);
        }}
        onPurchaseComplete={async () => {
          setShowCoinPurchaseModal(false);
          setTransformErrorState(null);
          // Update usage count after purchase
          if (userId) {
            const newCount = instructionsTransformationEngine.getUsageCount(userId);
            setUsageCount(newCount);
          }
          // Retry improvement after purchase
          if (internalValue && internalValue.replace(/\s/g, '').length > 0) {
            // Small delay to ensure coins are updated
            setTimeout(() => {
              handleImprove();
            }, 500);
          }
        }}
      />
    </>
  );
}


