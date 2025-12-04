import { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileText, Image as ImageIcon, Check, X, AlertCircle } from 'lucide-react';
import { useScanning } from '../hooks/useScanning';
import { useAuth } from '../contexts/AuthContext';

interface ScanUploadPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
  sourceType?: 'screenshot' | 'file' | 'paste' | 'api';
}

export default function ScanUploadPage({ onBack, onNavigate, sourceType = 'file' }: ScanUploadPageProps) {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { initiateScan } = useScanning();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadStatus('error');
      setErrorMessage('File too large. Maximum size is 10MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'application/json', 'text/csv', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setUploadStatus('error');
      setErrorMessage('Invalid file type. Please upload JPG, PNG, JSON, CSV, or TXT files.');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('success');
    setErrorMessage('');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleStartScan = async () => {
    if (sourceType === 'paste' && !textContent.trim()) {
      setUploadStatus('error');
      setErrorMessage('Please enter some text to scan');
      return;
    }

    if ((sourceType === 'file' || sourceType === 'screenshot') && !uploadedFile) {
      setUploadStatus('error');
      setErrorMessage('Please upload a file first');
      return;
    }

    // Handle CSV files directly
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      if (!user) {
        setUploadStatus('error');
        setErrorMessage('User not authenticated');
        return;
      }

      try {
        const csvText = await uploadedFile.text();
        const { startCsvScan } = await import('../services/scanner/scannerClient');
        const result = await startCsvScan(csvText, user.id);

        if (!result.success || !result.scanId) {
          setUploadStatus('error');
          setErrorMessage(result.error || 'Failed to start CSV scan');
          return;
        }

        // Navigate to processing page with scanId
        onNavigate('scan-processing', {
          sourceType: 'csv',
          scanId: result.scanId,
        });
        return;
      } catch (err: any) {
        setUploadStatus('error');
        setErrorMessage(err.message || 'Failed to process CSV file');
        return;
      }
    }

    onNavigate('scan-processing', {
      sourceType,
      file: uploadedFile,
      textContent,
    });
  };

  const fileTypeLabels = [
    { label: 'JPG/PNG', icon: <ImageIcon className="size-4" /> },
    { label: 'Facebook Export', icon: <FileText className="size-4" /> },
    { label: 'LinkedIn CSV', icon: <FileText className="size-4" /> },
    { label: 'TikTok Export', icon: <FileText className="size-4" /> },
    { label: 'IG Data', icon: <FileText className="size-4" /> },
    { label: 'Chat Logs', icon: <FileText className="size-4" /> },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center size-10 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Upload Data</h1>
              <p className="text-sm text-gray-600">
                {sourceType === 'paste' ? 'Paste your prospect data below' : 'Drop your files or click to browse'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {uploadStatus === 'error' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Upload Error</h3>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
            <button
              onClick={() => {
                setUploadStatus('idle');
                setErrorMessage('');
              }}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="size-5" />
            </button>
          </div>
        )}

        {uploadStatus === 'success' && uploadedFile && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="size-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="size-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">{uploadedFile.name}</h3>
              <p className="text-sm text-green-700">
                {(uploadedFile.size / 1024).toFixed(1)} KB • Ready to scan
              </p>
            </div>
            <button
              onClick={() => {
                setUploadedFile(null);
                setUploadStatus('idle');
              }}
              className="text-green-600 hover:text-green-800"
            >
              <X className="size-5" />
            </button>
          </div>
        )}

        {sourceType === 'paste' ? (
          <div className="space-y-4">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your prospect data here...&#10;&#10;Example:&#10;Sarah Martinez @sarahmartinez&#10;Looking for extra income opportunities&#10;&#10;John Doe @johndoe&#10;Interested in business ideas"
              className="w-full h-80 px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-3xl focus:outline-none focus:border-[#1877F2] focus:bg-white transition-all resize-none text-gray-900 placeholder:text-gray-400"
            />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="size-4" />
              <span>Supports: names, usernames, comments, posts, any text data</span>
            </div>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-3 border-dashed rounded-3xl p-12 transition-all cursor-pointer ${
              dragActive
                ? 'border-[#1877F2] bg-blue-50'
                : uploadStatus === 'success'
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-[#1877F2] hover:bg-blue-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              accept="image/*,.json,.csv,.txt"
              className="hidden"
            />

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                <Upload className="size-10 text-white" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {dragActive ? 'Drop your file here' : 'Drop your file here or click to browse'}
                </h3>
                <p className="text-sm text-gray-600">
                  Maximum file size: 10MB
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Supported Formats</h3>
          <div className="flex flex-wrap gap-2">
            {fileTypeLabels.map((type, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-200 text-sm font-medium text-gray-700"
              >
                {type.icon}
                {type.label}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartScan}
          disabled={
            (sourceType === 'paste' && !textContent.trim()) ||
            ((sourceType === 'file' || sourceType === 'screenshot') && !uploadedFile)
          }
          className="w-full py-4 bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Start AI Scan
        </button>

        <p className="text-center text-sm text-gray-500">
          This scan will cost{' '}
          <span className="font-semibold text-[#1877F2]">50 coins</span> from your balance
        </p>
      </main>
    </div>
  );
}
