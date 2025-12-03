import React from 'react';
import { Search, Flame, Clock, ChevronRight, Eye } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface RecentScan {
  id: string;
  totalItems: number;
  hotLeads: number;
  createdAt: string;
  status: string;
}

interface RecentScansListProps {
  scans: RecentScan[];
  onViewScan: (scanId: string) => void;
  onViewAll: () => void;
}

export default function RecentScansList({ scans, onViewScan, onViewAll }: RecentScansListProps) {
  if (scans.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-[#E4E6EB]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#050505]">Recent Scans</h3>
        <button
          onClick={onViewAll}
          className="text-sm font-semibold text-[#1877F2] hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-2">
        {scans.slice(0, 3).map((scan) => (
          <div
            key={scan.id}
            className="flex items-center justify-between p-3 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-xl transition-colors cursor-pointer group"
            onClick={() => onViewScan(scan.id)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Search className="w-5 h-5 text-[#1877F2]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[#050505]">
                    {scan.totalItems} items
                  </span>
                  {scan.hotLeads > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 rounded-full">
                      <Flame className="w-3 h-3 text-red-600" />
                      <span className="text-xs font-bold text-red-600">
                        {scan.hotLeads} Hot
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#65676B]">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(scan.createdAt)}
                </div>
              </div>
            </div>

            <button className="flex-shrink-0 w-8 h-8 bg-[#1877F2] rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onViewAll}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#1877F2] hover:bg-[#F0F2F5] rounded-xl transition-colors"
      >
        View All Scans
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
