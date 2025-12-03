import { Upload, FileText, Globe, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface CompanyUploadBannerProps {
  onUploadClick: () => void;
}

export default function CompanyUploadBanner({ onUploadClick }: CompanyUploadBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Supercharge Your AI with Company Data
              </h2>
              <p className="text-blue-100 text-sm">
                Get 3-5× better results with personalized, branded content
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white opacity-60 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 border border-white border-opacity-20">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Upload Presentation</h3>
            <p className="text-blue-100 text-sm">
              PDF or PowerPoint to train your AI with your exact pitch
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 border border-white border-opacity-20">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-3">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Upload Brochure</h3>
            <p className="text-blue-100 text-sm">
              Product catalog or marketing materials for accurate messaging
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 border border-white border-opacity-20">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Add Website Link</h3>
            <p className="text-blue-100 text-sm">
              AI extracts your story, products, and brand voice automatically
            </p>
          </div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-yellow-900" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold mb-2 text-lg">What You'll Get:</h3>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                  Customized, branded pitch decks using YOUR materials
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                  Personalized AI messages in your company's exact tone
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                  Company-compliant content that follows your guidelines
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                  <strong className="text-white">BONUS: Earn up to 925 coins!</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onUploadClick}
          className="w-full bg-white text-purple-600 font-bold py-4 px-6 rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
        >
          <Upload className="w-6 h-6" />
          <span>Upload Company Materials Now</span>
          <ArrowRight className="w-6 h-6" />
        </button>

        <p className="text-center text-blue-100 text-sm mt-4">
          Takes 2-3 minutes • AI learns instantly • Results improve immediately
        </p>
      </div>
    </div>
  );
}
