import { useState } from 'react';
import { ArrowLeft, Upload, CheckCircle2, AlertTriangle, FileText, Download, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateCsv, CsvValidationResult } from '../services/scanOptimizationTools';

interface CsvCheckPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function CsvCheckPage({ onBack, onNavigate }: CsvCheckPageProps) {
  const { user } = useAuth();
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<CsvValidationResult | null>(null);
  const [rawCsv, setRawCsv] = useState<string>('');

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidating(true);
    setResult(null);

    try {
      const text = await file.text();
      setRawCsv(text);

      const validationResult = await validateCsv(text, user?.id);
      setResult(validationResult);
    } catch (error: any) {
      console.error('Validation error:', error);
      alert(`Failed to validate CSV: ${error.message}`);
    } finally {
      setValidating(false);
    }
  }

  function handleDownloadCleaned() {
    if (!result?.cleanedCsvContent) return;

    const blob = new Blob([result.cleanedCsvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_prospects.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleContinueToScan() {
    if (!result?.cleanedCsvContent) return;

    const blob = new Blob([result.cleanedCsvContent], { type: 'text/csv' });
    const file = new File([blob], 'cleaned_prospects.csv', { type: 'text/csv' });

    onNavigate('scan-upload', { uploadedFile: file });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CSV Health Check</h1>
              <p className="text-sm text-gray-600">Validate your CSV before scanning</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Your CSV</h2>
              <p className="text-gray-600">
                We'll check for common issues and help you fix them before scanning
              </p>
            </div>

            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={validating}
                />
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    {validating ? 'Validating CSV...' : 'Click to upload CSV file'}
                  </p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </div>
              </div>
            </label>

            {validating && (
              <div className="mt-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Validating your CSV...</p>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Validation Results</h2>
                <button
                  onClick={() => {
                    setResult(null);
                    setRawCsv('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Upload Another File
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Rows</div>
                  <div className="text-3xl font-bold text-gray-900">{result.totalRows}</div>
                </div>

                <div className={`p-4 rounded-lg ${result.validRows > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="text-sm text-gray-600 mb-1">Valid Rows</div>
                  <div className={`text-3xl font-bold ${result.validRows > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.validRows}
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${result.issues.length === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <div className="text-sm text-gray-600 mb-1">Issues Found</div>
                  <div className={`text-3xl font-bold ${result.issues.length === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {result.issues.length}
                  </div>
                </div>
              </div>

              {result.valid && result.validRows > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 mb-6">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-green-900">CSV is valid!</div>
                    <div className="text-sm text-green-700">
                      Your CSV passed validation and is ready to scan.
                    </div>
                  </div>
                </div>
              )}

              {!result.valid && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-900">CSV has issues</div>
                    <div className="text-sm text-red-700">
                      Please review and fix the issues below before scanning.
                    </div>
                  </div>
                </div>
              )}

              {result.issues.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">
                    Issues Found ({result.issues.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.issues.slice(0, 10).map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3"
                      >
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Row {issue.rowIndex}: {issue.type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{issue.message}</div>
                        </div>
                      </div>
                    ))}

                    {result.issues.length > 10 && (
                      <div className="text-sm text-gray-600 text-center py-2">
                        + {result.issues.length - 10} more issues
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {result.cleanedCsvContent && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Cleaned Version Available
                </h3>
                <p className="text-gray-600 mb-4">
                  We've created a cleaned version of your CSV with issues fixed or problematic rows removed.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadCleaned}
                    className="flex-1 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Cleaned CSV
                  </button>

                  <button
                    onClick={handleContinueToScan}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    Continue to Scan
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {!result.valid && !result.cleanedCsvContent && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">What to do next?</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Fix the issues in your CSV file using a spreadsheet editor</p>
                  <p>• Make sure there's a "name" column with valid prospect names</p>
                  <p>• Remove or fix any empty rows</p>
                  <p>• Ensure all required fields are filled in</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
