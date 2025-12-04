import React from 'react';
import { Flame, Droplet, Snowflake, Clock, Eye, Image, FileText, Link2, Chrome } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface ScanSummaryHeaderProps {
  totalProspects: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  sourceType: string;
  timestamp: string;
  onViewRawData: () => void;
}

export default function ScanSummaryHeader({
  totalProspects,
  hotLeads,
  warmLeads,
  coldLeads,
  sourceType,
  timestamp,
  onViewRawData,
}: ScanSummaryHeaderProps) {
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'screenshots':
        return <Image className="w-4 h-4" />;
      case 'files_csv':
      case 'files_facebook_export':
      case 'files_linkedin_export':
        return <FileText className="w-4 h-4" />;
      case 'social_url':
        return <Link2 className="w-4 h-4" />;
      case 'browser_extension':
        return <Chrome className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (type: string) => {
    switch (type) {
      case 'screenshots':
        return 'Screenshots';
      case 'files_csv':
        return 'CSV File';
      case 'files_facebook_export':
        return 'Facebook Export';
      case 'files_linkedin_export':
        return 'LinkedIn Export';
      case 'social_url':
        return 'URL Scan';
      case 'browser_extension':
        return 'Browser Extension';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white border-b border-[#E4E6EB] sticky top-0 z-20">
      <div className="max-w-[620px] mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-[#050505]">{totalProspects} Prospects</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-[#65676B]">
                {getSourceIcon(sourceType)}
                <span className="text-sm">{getSourceLabel(sourceType)}</span>
              </div>
              <span className="text-[#65676B]">•</span>
              <div className="flex items-center gap-1 text-[#65676B]">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{formatDistanceToNow(timestamp)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onViewRawData}
            className="flex items-center gap-2 px-4 py-2 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-xl text-sm font-semibold text-[#050505] transition-colors"
          >
            <Eye className="w-4 h-4" />
            Raw Data
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-red-900">Hot</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{hotLeads}</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplet className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-900">Warm</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{warmLeads}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Snowflake className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-900">Cold</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{coldLeads}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
