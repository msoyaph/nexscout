import { Activity, Server, Database, Zap, AlertTriangle, CheckCircle, Clock, Cpu } from 'lucide-react';

export default function SystemHealth() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <HealthCard title="System Uptime" value="99.98%" status="healthy" icon={Activity} />
        <HealthCard title="API Latency" value="142ms" status="healthy" icon={Zap} />
        <HealthCard title="Database" value="Optimal" status="healthy" icon={Database} />
        <HealthCard title="Error Rate" value="0.02%" status="healthy" icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Service Status</h3>
          <div className="space-y-3">
            <ServiceRow service="API Server" status="operational" uptime="99.99%" />
            <ServiceRow service="Database" status="operational" uptime="100%" />
            <ServiceRow service="AI Engine" status="operational" uptime="99.95%" />
            <ServiceRow service="Storage" status="operational" uptime="100%" />
            <ServiceRow service="Queue System" status="operational" uptime="99.98%" />
            <ServiceRow service="Webhooks" status="operational" uptime="99.92%" />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Response Time Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[142, 138, 145, 132, 148, 141, 142].map((ms, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-bold text-green-600 mb-1">{ms}ms</div>
                <div
                  className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg"
                  style={{ height: `${(ms / 200) * 100}%` }}
                />
                <span className="text-xs text-[#666] font-medium">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Server Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricPanel
            title="CPU Usage"
            value="34%"
            icon={Cpu}
            status="good"
            details="4 cores, 2.4 GHz avg"
          />
          <MetricPanel
            title="Memory Usage"
            value="68%"
            icon={Server}
            status="good"
            details="11.2 GB / 16 GB"
          />
          <MetricPanel
            title="Disk Usage"
            value="42%"
            icon={Database}
            status="good"
            details="210 GB / 500 GB"
          />
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Recent Incidents</h3>
        <div className="space-y-3">
          {[
            { type: 'Resolved', title: 'Slow API response', duration: '5 minutes', time: '2 hours ago', severity: 'low' },
            { type: 'Resolved', title: 'Database connection spike', duration: '12 minutes', time: '1 day ago', severity: 'medium' },
            { type: 'Resolved', title: 'High memory usage', duration: '8 minutes', time: '2 days ago', severity: 'low' },
          ].map((incident, i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-[16px] border ${
              incident.severity === 'low' ? 'bg-blue-50 border-blue-200' :
              incident.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle className="size-5 text-green-600" />
                <div>
                  <p className="font-semibold text-sm text-[#1A1A1A]">{incident.title}</p>
                  <p className="text-xs text-[#666]">{incident.type} • Duration: {incident.duration}</p>
                </div>
              </div>
              <span className="text-xs text-[#666]">{incident.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Queue Processing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { queue: 'Email Queue', pending: 23, processing: 5, failed: 0 },
            { queue: 'AI Tasks', pending: 12, processing: 8, failed: 1 },
            { queue: 'Webhooks', pending: 5, processing: 2, failed: 0 },
          ].map((queue, i) => (
            <div key={i} className="bg-[#F4F6F8] rounded-[16px] p-4 border border-[#E6E8EB]">
              <h4 className="font-bold text-sm text-[#1A1A1A] mb-3">{queue.queue}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#666]">Pending</span>
                  <span className="font-semibold text-[#1A1A1A]">{queue.pending}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#666]">Processing</span>
                  <span className="font-semibold text-blue-600">{queue.processing}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#666]">Failed</span>
                  <span className="font-semibold text-red-600">{queue.failed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, value, status, icon: Icon }: any) {
  const statusColors = {
    healthy: { bg: 'bg-green-100', text: 'text-green-600' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    critical: { bg: 'bg-red-100', text: 'text-red-600' },
  };
  const colors = statusColors[status];

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-[16px] ${colors.bg} flex items-center justify-center`}>
          <Icon className={`size-6 ${colors.text}`} />
        </div>
        <div className="size-3 rounded-full bg-green-500 animate-pulse" />
      </div>
      <h3 className="text-sm font-medium text-[#666] mb-1">{title}</h3>
      <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function ServiceRow({ service, status, uptime }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#F4F6F8] rounded-[12px]">
      <div className="flex items-center gap-3">
        <div className="size-2 rounded-full bg-green-500" />
        <span className="font-semibold text-sm text-[#1A1A1A]">{service}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-[#666]">{uptime} uptime</span>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          {status}
        </span>
      </div>
    </div>
  );
}

function MetricPanel({ title, value, icon: Icon, status, details }: any) {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className="bg-[#F4F6F8] rounded-[16px] p-4 border border-[#E6E8EB]">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`size-5 ${statusColors[status]}`} />
        <h4 className="font-bold text-sm text-[#1A1A1A]">{title}</h4>
      </div>
      <p className={`text-3xl font-bold ${statusColors[status]} mb-2`}>{value}</p>
      <p className="text-xs text-[#666]">{details}</p>
    </div>
  );
}
