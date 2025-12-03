import { Shield } from 'lucide-react';

export default function DataPrivacyCard() {
  return (
    <div className="bg-[#EAF4FF] rounded-3xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
          <Shield className="size-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Your Data, Your Control
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            NexScout only analyzes the data you choose to upload. No hidden access. 100% secure.
          </p>
        </div>
      </div>
    </div>
  );
}
