/**
 * AI INSTRUCTIONS RICH EDITOR
 * 
 * WordPress-style rich editor for AI System Instructions
 * Features:
 * - Text editor (large textarea)
 * - Image insertion (URL or upload)
 * - File attachments (brochures, PDFs)
 * - Product images, logos, catalogs
 * - Visual preview of inserted media
 */

import { useState } from 'react';
import { 
  Image, 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  X, 
  Plus,
  Trash2,
  Check,
  AlertCircle 
} from 'lucide-react';
import { aiInstructionsService, type RichImage, type RichFile, type RichContent } from '../services/ai/aiInstructionsService';

interface AIInstructionsRichEditorProps {
  userId: string;
  value: RichContent;
  onChange: (content: RichContent) => void;
  placeholder?: string;
}

export default function AIInstructionsRichEditor({
  userId,
  value,
  onChange,
  placeholder
}: AIInstructionsRichEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageType, setImageType] = useState<RichImage['type']>('product');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<RichFile['type']>('brochure');
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');

  const handleTextChange = (text: string) => {
    onChange({
      ...value,
      text
    });
  };

  const handleAddImage = async () => {
    if (!imageUrl && uploadMode === 'url') return;

    const newImage: RichImage = {
      type: imageType,
      url: imageUrl,
      caption: imageCaption || undefined,
    };

    onChange({
      ...value,
      images: [...(value.images || []), newImage]
    });

    // Reset modal
    setImageUrl('');
    setImageCaption('');
    setShowImageModal(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await aiInstructionsService.uploadImage(userId, file, imageType);

      if (result.error) {
        alert(`Upload failed: ${result.error}`);
        return;
      }

      const newImage: RichImage = {
        type: imageType,
        url: result.url!,
        caption: imageCaption || file.name,
      };

      onChange({
        ...value,
        images: [...(value.images || []), newImage]
      });

      // Reset
      setImageCaption('');
      setShowImageModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const image = value.images[index];
    
    // Try to delete from storage if it's our URL
    if (image.url.includes('supabase')) {
      await aiInstructionsService.deleteImage(image.url);
    }

    onChange({
      ...value,
      images: value.images.filter((_, i) => i !== index)
    });
  };

  const handleAddFile = () => {
    if (!fileUrl) return;

    const newFile: RichFile = {
      type: fileType,
      url: fileUrl,
      name: fileName || fileUrl,
    };

    onChange({
      ...value,
      files: [...(value.files || []), newFile]
    });

    // Reset modal
    setFileUrl('');
    setFileName('');
    setShowFileModal(false);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await aiInstructionsService.uploadFile(userId, file, fileType);

      if (result.error) {
        alert(`Upload failed: ${result.error}`);
        return;
      }

      const newFile: RichFile = {
        type: fileType,
        url: result.url!,
        name: fileName || file.name,
        size: file.size,
      };

      onChange({
        ...value,
        files: [...(value.files || []), newFile]
      });

      // Reset
      setFileName('');
      setShowFileModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (index: number) => {
    const file = value.files[index];
    
    // Try to delete from storage if it's our URL
    if (file.url.includes('supabase')) {
      await aiInstructionsService.deleteFile(file.url);
    }

    onChange({
      ...value,
      files: value.files.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <button
          onClick={() => setShowImageModal(true)}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors"
        >
          <Image className="w-4 h-4" />
          <span>Insert Image</span>
        </button>
        <button
          onClick={() => setShowFileModal(true)}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Add File</span>
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-500">
          {value.images?.length || 0} images • {value.files?.length || 0} files
        </span>
      </div>

      {/* Main Text Editor */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Custom AI Instructions
        </label>
        <textarea
          value={value.text || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder || "Write your custom AI instructions here...\n\nYou can also insert images and files using the buttons above."}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm resize-y"
          style={{ minHeight: '250px', maxHeight: '500px' }}
          rows={Math.max(10, Math.ceil((value.text?.length || 0) / 80))}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {(value.text || '').length} characters
          </p>
        </div>
      </div>

      {/* Inserted Images Preview */}
      {value.images && value.images.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Image className="w-4 h-4 text-blue-600" />
            Inserted Images ({value.images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {value.images.map((img, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden group">
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={img.url}
                    alt={img.caption || img.type}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image';
                    }}
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-900 truncate">{img.caption || 'Untitled'}</p>
                  <p className="text-xs text-gray-500 capitalize">{img.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inserted Files Preview */}
      {value.files && value.files.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            Attached Files ({value.files.length})
          </h4>
          <div className="space-y-2">
            {value.files.map((file, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{file.type} • {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(idx)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insert Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Insert Image</h3>
                </div>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Upload Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    uploadMode === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  Image URL
                </button>
                <button
                  onClick={() => setUploadMode('upload')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    uploadMode === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload
                </button>
              </div>

              {/* Image Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Type
                </label>
                <select
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value as RichImage['type'])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="product">Product Image</option>
                  <option value="logo">Company Logo</option>
                  <option value="catalog">Catalog/Brochure</option>
                  <option value="screenshot">Screenshot</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {uploadMode === 'url' ? (
                <>
                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="e.g., Premium Product Package"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Preview */}
                  {imageUrl && (
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-2">Preview:</p>
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-32 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Invalid+URL';
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer block"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload image</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                      </label>
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="e.g., Premium Product Package"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {uploadMode === 'url' && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddImage}
                  disabled={!imageUrl}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Insert Image
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insert File Modal */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Add File</h3>
                </div>
                <button
                  onClick={() => setShowFileModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Upload Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    uploadMode === 'url'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  File URL
                </button>
                <button
                  onClick={() => setUploadMode('upload')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    uploadMode === 'upload'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload
                </button>
              </div>

              {/* File Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Type
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as RichFile['type'])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="brochure">Company Brochure</option>
                  <option value="doc">Document</option>
                  <option value="pdf">PDF File</option>
                  <option value="spreadsheet">Spreadsheet</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {uploadMode === 'url' ? (
                <>
                  {/* File URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File URL
                    </label>
                    <input
                      type="url"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://example.com/brochure.pdf"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* File Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="e.g., Company Brochure 2024"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer block"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload file</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, XLS, PPT up to 10MB</p>
                      </label>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Leave blank to use file name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </>
              )}
            </div>

            {uploadMode === 'url' && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowFileModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFile}
                  disabled={!fileUrl}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Note */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-900">Uploading...</p>
        </div>
      )}
    </div>
  );
}




