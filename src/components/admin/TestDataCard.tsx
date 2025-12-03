import React from 'react';
import { Loader2 } from 'lucide-react';

interface TestDataCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export default function TestDataCard({
  title,
  description,
  icon,
  children,
  isLoading = false,
  isDestructive = false,
}: TestDataCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 p-6 ${
        isDestructive ? 'border-red-200' : 'border-[#E4E6EB]'
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            isDestructive ? 'bg-red-100' : 'bg-[#F0F2F5]'
          }`}
        >
          {isLoading ? (
            <Loader2 className={`w-6 h-6 animate-spin ${isDestructive ? 'text-red-600' : 'text-[#1877F2]'}`} />
          ) : (
            icon
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold mb-1 ${isDestructive ? 'text-red-900' : 'text-[#050505]'}`}>
            {title}
          </h3>
          <p className={`text-sm ${isDestructive ? 'text-red-700' : 'text-[#65676B]'}`}>{description}</p>
        </div>
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}
