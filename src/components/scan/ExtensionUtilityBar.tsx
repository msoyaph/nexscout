import React from 'react';
import { Zap, Search, Download, BookOpen } from 'lucide-react';

interface ExtensionUtilityBarProps {
  onDownload: () => void;
  onSetupGuide: () => void;
}

export default function ExtensionUtilityBar({ onDownload, onSetupGuide }: ExtensionUtilityBarProps) {
  return (
    <div className="bg-gradient-to-r from-[#1877F2] to-[#8B5CF6] rounded-2xl shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <Zap className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Faster Scanning</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Better Accuracy</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onDownload}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-[#1877F2] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Extension
          </button>
          <button
            onClick={onSetupGuide}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Setup Guide
          </button>
        </div>
      </div>
    </div>
  );
}
