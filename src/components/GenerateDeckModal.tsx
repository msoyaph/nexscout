import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Download, Share2, ChevronLeft, ChevronRight, Lock, Upload, FileText, Globe, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { messagingEngine } from '../services/ai/messagingEngine';
import TierBadge from './TierBadge';

interface GenerateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: string;
  prospectName: string;
  userId: string;
  userTier: 'free' | 'pro' | 'elite';
}

export default function GenerateDeckModal({
  isOpen,
  onClose,
  prospectId,
  prospectName,
  userId,
  userTier,
}: GenerateDeckModalProps) {
  const [productName, setProductName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [version, setVersion] = useState<'basic' | 'elite'>('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<any>(null);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [useCompanyData, setUseCompanyData] = useState(false);
  const [hasCompanyData, setHasCompanyData] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);

  useEffect(() => {
    checkCompanyData();
  }, [userId]);

  const checkCompanyData = async () => {
    try {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      setHasCompanyData(!!profile);
    } catch (error) {
      console.error('Error checking company data:', error);
    }
  };

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError('Please enter a product or opportunity name');
      return;
    }

    if (version === 'elite' && userTier !== 'pro') {
      setError('Advanced pitch decks are only available for Pro subscribers.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedDeck(null);

    const result = await messagingEngine.generateDeck({
      userId,
      prospectId,
      productName: productName.trim(),
      companyName: companyName.trim() || undefined,
      version,
    });

    setIsGenerating(false);

    if (result.success && result.deck) {
      setGeneratedDeck(result.deck);
    } else {
      setError(result.error || 'Failed to generate pitch deck');
    }
  };

  const slides = generatedDeck?.slides || [];
  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-4xl rounded-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generate Pitch Deck</h3>
              <p className="text-sm text-gray-500">For {prospectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!generatedDeck ? (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm text-red-800">{error}</p>
                  {error.includes('Upgrade') && (
                    <button
                      onClick={() => window.location.href = '/pricing'}
                      className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      View Plans →
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product/Opportunity Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., My Business Opportunity"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., My Company"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-4">
                {hasCompanyData && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border-2 border-purple-200">
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCompanyData}
                        onChange={(e) => setUseCompanyData(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-purple-400 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-slate-900 text-base">
                            Use AI System Instructions
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">
                          Use your custom AI instructions and company intelligence data (company profile, materials, brand voice, products, images, and AI-learned insights)
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Collapsible Company Materials */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setShowMaterials(!showMaterials)}
                    type="button"
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Company Materials (Optional)
                      </span>
                      <span className="text-xs text-purple-600 font-medium px-2 py-0.5 bg-purple-100 rounded-full">Recommended</span>
                    </div>
                    {showMaterials ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {showMaterials && (
                    <div className="p-4 space-y-3 border-t border-gray-200">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-400 transition-colors cursor-pointer bg-gradient-to-br from-white to-purple-50">
                        <input
                          type="file"
                          accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setUploadedFiles([...uploadedFiles, ...files]);
                          }}
                          className="hidden"
                          id="company-files"
                        />
                        <label htmlFor="company-files" className="cursor-pointer">
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                            <p className="font-semibold text-gray-900 mb-1">
                              Upload Company Presentation or Brochure
                            </p>
                            <p className="text-sm text-gray-600">
                              PDF, PowerPoint, or images • Creates branded, accurate pitch decks
                            </p>
                          </div>
                        </label>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-3 bg-green-50 rounded-xl p-3 border border-green-200">
                              <FileText className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium text-gray-900 flex-1">{file.name}</span>
                              <button
                                onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                                type="button"
                                className="text-gray-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible Company Website */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setShowWebsite(!showWebsite)}
                    type="button"
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      Add your company website (Optional)
                    </span>
                    {showWebsite ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {showWebsite && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          placeholder="https://yourcompany.com"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        AI will extract your company story, products, and brand automatically
                      </p>
                    </div>
                  )}
                </div>

                {(useCompanyData || uploadedFiles.length > 0 || companyWebsite) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          {useCompanyData ? 'Using AI System Instructions!' : 'Great! Your AI is now supercharged!'}
                        </p>
                        <p className="text-xs text-green-800">
                          {useCompanyData
                            ? 'Your pitch deck will use custom AI instructions, company data, brand voice, and all AI insights.'
                            : 'Your pitch deck will be customized with YOUR exact company data, products, and brand voice.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Deck Version</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVersion('basic')}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      version === 'basic'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Basic</span>
                      <span className="text-xs text-purple-600 font-medium">75 coins</span>
                    </div>
                    <p className="text-sm text-gray-600">6-slide standard pitch deck</p>
                  </button>

                  <button
                    onClick={() => setVersion('elite')}
                    disabled={userTier !== 'pro'}
                    className={`p-4 rounded-2xl border-2 transition-all text-left relative ${
                      version === 'elite'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${userTier !== 'pro' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">Advanced</span>
                        <TierBadge tier="pro" />
                      </div>
                      <span className="text-xs text-yellow-600 font-medium">75 coins</span>
                    </div>
                    <p className="text-sm text-gray-600">Enhanced 10-slide deck with data</p>
                    {userTier !== 'pro' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-2xl">
                        <Lock className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !productName.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium py-4 rounded-2xl hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Pitch Deck...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Pitch Deck (75 coins)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 aspect-video flex flex-col justify-center items-start relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
                <div className="relative z-10">
                  <div className="text-sm font-medium text-purple-400 mb-3">
                    SLIDE {currentSlide + 1} / {slides.length}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-6">{currentSlideData?.title}</h2>
                  <div className="text-lg text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {currentSlideData?.content}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {slides.map((slide: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      index === currentSlide
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}. {slide.title}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className="p-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="p-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  <span>Export PDF</span>
                </button>
                <button className="flex-1 px-6 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
