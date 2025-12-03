import React, { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';

interface ScanURLCardProps {
  onScan: (url: string) => Promise<void>;
}

export default function ScanURLCard({ onScan }: ScanURLCardProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    try {
      await onScan(url);
    } finally {
      setLoading(false);
    }
  };

  const socialIcons = [
    { name: 'Facebook', color: '#1877F2', icon: 'f' },
    { name: 'Instagram', color: '#E4405F', icon: 'ig' },
    { name: 'Twitter', color: '#1DA1F2', icon: 'x' },
    { name: 'LinkedIn', color: '#0A66C2', icon: 'in' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#E4E6EB]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#F0F2F5] rounded-full flex items-center justify-center">
          <Globe className="w-5 h-5 text-[#1877F2]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#050505]">Scan a Social Media URL</h3>
          <p className="text-sm text-[#65676B]">Instantly analyze any profile or page</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://facebook.com/... OR https://instagram.com/..."
            className="w-full px-4 py-3 bg-[#F0F2F5] border border-[#E4E6EB] rounded-xl text-[#050505] placeholder-[#65676B] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent transition-all"
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#65676B] font-medium">Supported:</span>
            {socialIcons.map((social) => (
              <div
                key={social.name}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: social.color }}
                title={social.name}
              >
                {social.icon}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!url.trim() || loading}
            className="flex items-center gap-2 bg-[#1877F2] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              'Scan Now'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
