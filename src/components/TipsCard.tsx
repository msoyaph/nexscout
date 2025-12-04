import { Lightbulb, CheckCircle2 } from 'lucide-react';

const tips = [
  'Upload screenshots that show names, comments, reactions',
  'Add CSV exports from Facebook or LinkedIn',
  'Paste text from chats or comment threads',
  'Add multiple batches for higher ScoutScore accuracy',
  'Connect your FB Page for auto-enriched data',
  'Re-scan earlier prospects for updated AI insights',
  'Add more friends list screenshots for better context'
];

export default function TipsCard() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Lightbulb className="size-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            How to Make Your AI Scanner Smarter
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Follow these tips to improve your scanner's accuracy
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-white transition-colors"
          >
            <CheckCircle2 className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
