import { useState } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';

const tips = [
  'Upload more screenshots for deeper pattern detection',
  'Connect FB/IG/LinkedIn for auto-context',
  'Add comment screenshots to detect engagement intent',
  'Upload again next week for fresh lead data',
  'The more you scan, the smarter NexScout gets'
];

export default function SmartTipsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % tips.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="size-5 text-yellow-600" fill="currentColor" />
        <h3 className="text-base font-bold text-gray-900">Smart Tips</h3>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={prev}
          className="size-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
        >
          <ChevronLeft className="size-5 text-gray-700" />
        </button>

        <div className="flex-1 min-h-[60px] flex items-center justify-center">
          <p className="text-sm text-gray-700 text-center leading-relaxed">
            {tips[currentIndex]}
          </p>
        </div>

        <button
          onClick={next}
          className="size-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
        >
          <ChevronRight className="size-5 text-gray-700" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        {tips.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
