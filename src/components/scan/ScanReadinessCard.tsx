import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';

interface Issue {
  category: string;
  item: string;
  message: string;
  fix: string;
}

interface ScanReadinessCardProps {
  ready: boolean;
  loading: boolean;
  envIssues: Issue[];
  serviceIssues: Issue[];
  dbIssues: Issue[];
  thirdPartyIssues: Issue[];
  onRefresh: () => void;
}

interface IssueSection {
  title: string;
  issues: Issue[];
  icon: React.ReactNode;
}

export default function ScanReadinessCard({
  ready,
  loading,
  envIssues,
  serviceIssues,
  dbIssues,
  thirdPartyIssues,
  onRefresh,
}: ScanReadinessCardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    env: false,
    services: false,
    database: false,
    thirdParty: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sections: IssueSection[] = [
    {
      title: 'Environment Variables',
      issues: envIssues,
      icon: '🔑',
    },
    {
      title: 'AI Services',
      issues: serviceIssues,
      icon: '🤖',
    },
    {
      title: 'Third Party Integrations',
      issues: thirdPartyIssues,
      icon: '🌐',
    },
    {
      title: 'Database Tables',
      issues: dbIssues,
      icon: '💾',
    },
  ];

  const totalIssues = envIssues.length + serviceIssues.length + dbIssues.length + thirdPartyIssues.length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#E4E6EB] p-6">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 text-[#1877F2] animate-spin" />
          <span className="text-sm text-[#65676B]">Checking system readiness...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 p-6 ${
        ready ? 'border-green-200' : 'border-red-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {ready ? (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          )}

          <div className="flex-1">
            {ready ? (
              <>
                <h3 className="text-xl font-bold text-green-900 mb-1">✅ Ready to Scan</h3>
                <p className="text-sm text-green-700">
                  Your system is fully operational. All services and dependencies are working correctly.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-red-900 mb-1">⚠️ System Not Ready to Scan</h3>
                <p className="text-sm text-red-700 mb-2">
                  Fix the {totalIssues} issue{totalIssues !== 1 ? 's' : ''} below to enable scanning.
                </p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded-xl text-sm font-semibold text-[#050505] transition-colors flex-shrink-0"
          title="Refresh diagnostics"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {!ready && totalIssues > 0 && (
        <div className="space-y-3 mt-4">
          {sections.map((section, idx) => {
            if (section.issues.length === 0) return null;

            const sectionKey = section.title.toLowerCase().replace(/\s+/g, '_');
            const isExpanded = expandedSections[sectionKey];

            return (
              <div key={idx} className="border border-[#E4E6EB] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full flex items-center justify-between p-4 bg-[#F0F2F5] hover:bg-[#E4E6EB] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-[#050505]">{section.title}</h4>
                      <p className="text-xs text-[#65676B]">
                        {section.issues.length} issue{section.issues.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-[#65676B]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#65676B]" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 space-y-3 bg-white">
                    {section.issues.map((issue, issueIdx) => (
                      <div key={issueIdx} className="border-l-4 border-red-500 pl-4 py-2">
                        <div className="flex items-start gap-2 mb-1">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="text-sm font-bold text-[#050505]">{issue.item}</h5>
                          </div>
                        </div>
                        <p className="text-sm text-[#65676B] mb-2 ml-6">{issue.message}</p>
                        <div className="ml-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-blue-900 mb-1">How to fix:</p>
                              <p className="text-xs text-blue-700">{issue.fix}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ready && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700">
            All systems operational. You can now paste your text and start scanning for prospects.
          </p>
        </div>
      )}
    </div>
  );
}
