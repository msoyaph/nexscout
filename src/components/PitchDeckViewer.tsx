import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Save, Lock, X, RefreshCw } from 'lucide-react';
import type { Slide } from '../services/ai/pitchDeckGenerator';

interface PitchDeckViewerProps {
  slides: Slide[];
  deckType: 'basic' | 'elite';
  prospectName: string;
  locked?: boolean;
  upgradePrompt?: string;
  deckId?: string;
  onClose: () => void;
  onSave?: () => void;
  onExport?: (format: 'json' | 'html') => void;
  onRegenerate?: () => void;
  onUpgrade?: () => void;
}

export default function PitchDeckViewer({
  slides,
  deckType,
  prospectName,
  locked,
  upgradePrompt,
  deckId,
  onClose,
  onSave,
  onExport,
  onRegenerate,
  onUpgrade,
}: PitchDeckViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [slideTransition, setSlideTransition] = useState(false);

  const totalSlides = slides.length;
  const lockedSlideIndex = deckType === 'elite' ? 7 : -1;

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setSlideTransition(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setSlideTransition(false);
      }, 150);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      const nextIndex = currentSlide + 1;
      if (locked && nextIndex >= lockedSlideIndex) {
        return;
      }
      setSlideTransition(true);
      setTimeout(() => {
        setCurrentSlide(nextIndex);
        setSlideTransition(false);
      }, 150);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const currentSlideData = slides[currentSlide];
  const isSlideBlurred = locked && currentSlide >= lockedSlideIndex;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">
              {deckType === 'elite' ? 'Elite' : 'Basic'} Pitch Deck
            </h2>
            <p className="text-sm text-gray-500">For {prospectName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}

          {onSave && !deckId && (
            <button
              onClick={onSave}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}

          {onExport && (
            <div className="relative group">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 hidden group-hover:block z-10">
                <button
                  onClick={() => onExport('html')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                >
                  Export as HTML
                </button>
                <button
                  onClick={() => onExport('json')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Slide Area */}
      <div
        className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full max-w-4xl">
          {/* Slide Card */}
          <div
            className={`bg-white rounded-[28px] shadow-2xl p-12 min-h-[500px] flex flex-col justify-center transition-opacity duration-200 ${
              isSlideBlurred ? 'blur-sm' : ''
            } ${
              slideTransition ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {currentSlideData?.title}
              </h1>
              <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-5">
              {currentSlideData?.bullets.map((bullet, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 text-lg text-gray-700"
                >
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mt-2.5 flex-shrink-0 shadow-sm"></div>
                  <p className="leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>

            {currentSlideData?.cta && (
              <div className="mt-10 pt-8 border-t-2 border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center leading-relaxed">
                    {currentSlideData.cta}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Lock Overlay */}
          {isSlideBlurred && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-[28px] shadow-2xl p-8 max-w-md text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Elite Deck Locked
                </h3>
                <p className="text-gray-600 mb-6">
                  {upgradePrompt || 'Upgrade to Elite to access advanced personalized slides.'}
                </p>
                <button
                  onClick={onUpgrade}
                  className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-700 transition-all"
                >
                  Upgrade to Elite
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Slide Indicators */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => {
              const isLocked = locked && index >= lockedSlideIndex;
              return (
                <button
                  key={index}
                  onClick={() => !isLocked && setCurrentSlide(index)}
                  className={`transition-all rounded-full ${
                    index === currentSlide
                      ? 'w-8 h-2 bg-blue-600'
                      : isLocked
                      ? 'w-2 h-2 bg-gray-300'
                      : 'w-2 h-2 bg-gray-400 hover:bg-gray-500'
                  }`}
                  disabled={isLocked}
                />
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={currentSlide === totalSlides - 1 || (locked && currentSlide >= lockedSlideIndex - 1)}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mt-2">
          <p className="text-sm text-gray-500">
            Slide {currentSlide + 1} of {totalSlides}
          </p>
        </div>
      </div>

    </div>
  );
}
