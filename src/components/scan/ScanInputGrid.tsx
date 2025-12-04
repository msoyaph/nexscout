import React from 'react';
import { Image, FileText, Type, Users } from 'lucide-react';

interface ScanInputGridProps {
  onScreenshots: () => void;
  onFiles: () => void;
  onPasteText: () => void;
  onConnectSocial: () => void;
}

export default function ScanInputGrid({
  onScreenshots,
  onFiles,
  onPasteText,
  onConnectSocial,
}: ScanInputGridProps) {
  const cards = [
    {
      icon: Image,
      title: 'Screenshots',
      description: 'Upload images to scan',
      color: '#1877F2',
      bgColor: 'bg-blue-50',
      onClick: onScreenshots,
    },
    {
      icon: FileText,
      title: 'Files',
      description: 'CSV, JSON, or HTML',
      color: '#8B5CF6',
      bgColor: 'bg-purple-50',
      onClick: onFiles,
    },
    {
      icon: Type,
      title: 'Paste Text',
      description: 'Copy and paste content',
      color: '#10B981',
      bgColor: 'bg-green-50',
      onClick: onPasteText,
    },
    {
      icon: Users,
      title: 'Connect Social',
      description: 'Direct API integration',
      color: '#F59E0B',
      bgColor: 'bg-amber-50',
      onClick: onConnectSocial,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <button
            key={index}
            onClick={card.onClick}
            className="group bg-white rounded-2xl shadow-sm p-5 border border-[#E4E6EB] hover:border-[#1877F2] hover:shadow-md transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-[#050505] mb-1">{card.title}</h4>
                <p className="text-sm text-[#65676B]">{card.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
