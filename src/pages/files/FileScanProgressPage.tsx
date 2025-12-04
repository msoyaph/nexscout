/**
 * File Scan Progress Page
 *
 * Real-time progress tracking for file intelligence scans
 */

import { useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Loader, FileText } from 'lucide-react';
import { useFileScanProgress } from '../../hooks/useFileScanProgress';

interface FileScanProgressPageProps {
  scanBatchId: string;
  onBack: () => void;
  onComplete: (scanBatchId: string) => void;
}

export default function FileScanProgressPage({
  scanBatchId,
  onBack,
  onComplete,
}: FileScanProgressPageProps) {
  const { progress, loading, error } = useFileScanProgress(scanBatchId);

  useEffect(() => {
    if (progress?.batchStatus === 'completed') {
      // Auto-redirect after 2 seconds
      const timeout = setTimeout(() => {
        onComplete(scanBatchId);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [progress?.batchStatus, scanBatchId, onComplete]);

  if (loading && !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scan progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Scan</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) return null;

  const isCompleted = progress.batchStatus === 'completed';
  const isFailed = progress.batchStatus === 'failed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Scan Complete!</span>
            </div>
          )}
        </div>

        {/* Main Progress Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            {!isCompleted && !isFailed && (
              <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            )}
            {isCompleted && (
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            )}
            {isFailed && (
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isCompleted ? 'Scan Complete!' : isFailed ? 'Scan Failed' : 'Scanning Your Files...'}
            </h1>
            <p className="text-gray-600">
              {isCompleted
                ? 'Your files have been processed successfully'
                : isFailed
                ? 'Some files failed to process'
                : 'Please wait while we process your files'}
            </p>
          </div>

          {/* Overall Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-2xl font-bold text-blue-600">{progress.progressPercent}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>{progress.completedFiles} of {progress.totalFiles} files completed</span>
              {progress.failedFiles > 0 && (
                <span className="text-red-600">{progress.failedFiles} failed</span>
              )}
            </div>
          </div>

          {/* Step Progress */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Processing Steps</h3>
            {progress.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {step.percent === 100 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : step.total > 0 ? (
                    <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{step.name}</span>
                    <span className="text-sm text-gray-600">
                      {step.completed} / {step.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${step.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Files List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Files</h3>
            <div className="space-y-3">
              {progress.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {file.fileName}
                  </span>
                  {file.status === 'completed' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Done
                    </span>
                  )}
                  {file.status === 'processing' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-2">
                      <Loader className="w-3 h-3 animate-spin" />
                      Processing
                    </span>
                  )}
                  {file.status === 'pending' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                      Queued
                    </span>
                  )}
                  {file.status === 'failed' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      Failed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {isCompleted && (
            <div className="mt-8 text-center">
              <button
                onClick={() => onComplete(scanBatchId)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                View Results
              </button>
            </div>
          )}
        </div>

        {/* Info Card */}
        {!isCompleted && !isFailed && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex gap-4">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  You can leave this page
                </h4>
                <p className="text-sm text-blue-700">
                  Your files are being processed in the background. We'll notify you when they're ready.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
