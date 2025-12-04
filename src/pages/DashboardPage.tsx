/**
 * AI SALES DASHBOARD
 *
 * Complete sales intelligence command center
 * - KPI cards
 * - Funnel visualization
 * - Lead temperature distribution
 * - Channel performance
 * - Lead list with actions
 */

import React from 'react';

type KpiCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sublabel }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-gray-500">
      {label}
    </span>
    <span className="text-2xl font-semibold text-gray-900">{value}</span>
    {sublabel && (
      <span className="text-xs text-gray-400">{sublabel}</span>
    )}
  </div>
);

const SectionCard: React.FC<
  React.PropsWithChildren<{ title: string; actions?: React.ReactNode }>
> = ({ title, actions, children }) => (
  <section className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
    <header className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {actions && <div className="flex items-center gap-2 text-xs">{actions}</div>}
    </header>
    {children}
  </section>
);

export const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              NX
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                NexScout AI Sales
              </span>
              <span className="text-xs text-gray-400">
                Unified Prospecting & Funnel Intelligence
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select className="text-xs border rounded-lg px-2 py-1 text-gray-700">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Today</option>
              <option>This month</option>
              <option>Custom range…</option>
            </select>
            <button className="text-xs border rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-100">
              Team: Default
            </button>
            <button className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
              CJ
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Leads" value="1,248" sublabel="+12% vs last period" />
          <KpiCard label="Reply Rate" value="42%" sublabel="+6 pts" />
          <KpiCard label="Hot / Ready Leads" value="87" sublabel="Lead Temp ≥ 70" />
          <KpiCard label="AI-Closed Deals" value="24" sublabel="From auto sequences" />
        </div>

        {/* Funnel + Temperature/Channel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard
            title="Funnel Performance"
            actions={<button className="text-xs text-indigo-600">View details</button>}
          >
            <div className="flex flex-col gap-3">
              {/* Simple funnel bars */}
              {[
                { label: 'Awareness', value: 1000, width: '100%' },
                { label: 'Interest', value: 620, width: '62%' },
                { label: 'Evaluation', value: 340, width: '34%' },
                { label: 'Decision', value: 180, width: '18%' },
                { label: 'Closing', value: 92, width: '9.2%' },
              ].map((stage) => (
                <div key={stage.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{stage.label}</span>
                    <span>{stage.value}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: stage.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Lead Temperature" actions={null}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Cold', value: 540, color: 'bg-gray-300' },
                { label: 'Warm', value: 380, color: 'bg-amber-300' },
                { label: 'Hot', value: 220, color: 'bg-orange-400' },
                { label: 'Ready', value: 87, color: 'bg-emerald-400' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 border rounded-xl px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{item.label}</span>
                    <span className="text-[11px] text-gray-400">{item.value} leads</span>
                  </div>
                  <div className={`h-7 w-7 rounded-full ${item.color}`} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Channel Performance">
            <div className="flex flex-col gap-2 text-xs">
              {[
                { label: 'Facebook Messenger', conv: 420, replyRate: '48%' },
                { label: 'WhatsApp', conv: 310, replyRate: '51%' },
                { label: 'SMS', conv: 190, replyRate: '32%' },
                { label: 'Web Chat', conv: 140, replyRate: '45%' },
                { label: 'Email', conv: 88, replyRate: '28%' },
              ].map((ch) => (
                <div key={ch.label} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-gray-800">{ch.label}</span>
                    <span className="text-[11px] text-gray-400">
                      {ch.conv} conversations
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    {ch.replyRate} reply rate
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Lead Table */}
        <SectionCard
          title="Leads"
          actions={
            <>
              <button className="text-xs border rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-100">
                Filter
              </button>
              <button className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1">
                View all
              </button>
            </>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 pr-3">Lead</th>
                  <th className="py-2 pr-3">Temperature</th>
                  <th className="py-2 pr-3">Stage</th>
                  <th className="py-2 pr-3">Last Channel</th>
                  <th className="py-2 pr-3">Last Contact</th>
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {[
                  {
                    name: 'Juan Dela Cruz',
                    temp: 'Hot',
                    tempClass: 'bg-orange-100 text-orange-700',
                    stage: 'Decision',
                    channel: 'WhatsApp',
                    last: '2h ago',
                  },
                  {
                    name: 'Maria Santos',
                    temp: 'Warm',
                    tempClass: 'bg-amber-100 text-amber-700',
                    stage: 'Interest',
                    channel: 'Messenger',
                    last: '5h ago',
                  },
                  {
                    name: 'Carlos Reyes',
                    temp: 'Ready',
                    tempClass: 'bg-emerald-100 text-emerald-700',
                    stage: 'Closing',
                    channel: 'SMS',
                    last: '30m ago',
                  },
                ].map((lead) => (
                  <tr key={lead.name} className="border-b last:border-0">
                    <td className="py-2 pr-3">{lead.name}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${lead.tempClass}`}
                      >
                        {lead.temp}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-[11px] text-gray-500">
                      {lead.stage}
                    </td>
                    <td className="py-2 pr-3 text-[11px] text-gray-500">
                      {lead.channel}
                    </td>
                    <td className="py-2 pr-3 text-[11px] text-gray-400">
                      {lead.last}
                    </td>
                    <td className="py-2 pl-3 text-right">
                      <button className="text-[11px] text-indigo-600 hover:underline mr-2">
                        Open chat
                      </button>
                      <button className="text-[11px] text-gray-500 hover:underline">
                        View funnel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </main>
    </div>
  );
};

export default DashboardPage;
