import { ArrowLeft, Shield, Eye, Lock, Database, Cookie, Bell, UserCheck } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigateBack: () => void;
}

export default function PrivacyPolicyPage({ onNavigateBack }: PrivacyPolicyPageProps) {
  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center justify-center size-11 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Privacy Policy</h1>
          <div className="size-11" />
        </div>
      </header>

      <main className="px-6 mt-6 space-y-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[24px] p-6 border-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <Shield className="size-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-[#111827] mb-2">Your Privacy Matters</h2>
              <p className="text-sm text-[#6B7280]">
                This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our AI-powered sales platform. We are committed to protecting your privacy and ensuring transparency in our data practices.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Database className="size-5 text-blue-600" />
            <h3 className="font-bold text-lg text-[#111827]">1. Information We Collect</h3>
          </div>
          <div className="space-y-4 text-sm text-[#6B7280]">
            <div>
              <p className="font-semibold text-[#111827] mb-2">Account Information:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Name, email address, and phone number</li>
                <li>Company name and profession</li>
                <li>Password (encrypted and never stored in plain text)</li>
                <li>Profile photo and bio (optional)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Payment Information:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Billing address and payment method details</li>
                <li>Transaction history and invoices</li>
                <li>Note: Credit card information is processed by secure third-party payment processors and never stored on our servers</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Usage Data:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Pages visited, features used, and time spent on platform</li>
                <li>Search queries and AI interaction history</li>
                <li>Device information, IP address, and browser type</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Prospect and Sales Data:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Prospect information you input or import</li>
                <li>AI scan results and insights generated</li>
                <li>Messages, notes, and communications logs</li>
                <li>Pipeline data and sales activity records</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="size-5 text-purple-600" />
            <h3 className="font-bold text-lg text-[#111827]">2. How We Use Your Information</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p className="font-semibold text-[#111827]">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Provide, maintain, and improve our services and features</li>
              <li>Process transactions and send transaction notifications</li>
              <li>Generate AI-powered insights and recommendations</li>
              <li>Communicate with you about updates, offers, and support</li>
              <li>Personalize your experience and customize content</li>
              <li>Detect, prevent, and address fraud and security issues</li>
              <li>Analyze usage patterns to improve our AI models and services</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
              <li>Conduct research and development for new features</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="size-5 text-red-600" />
            <h3 className="font-bold text-lg text-[#111827]">3. How We Share Your Information</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              <span className="font-semibold text-[#111827]">We do NOT sell your personal information.</span> We may share your information only in the following circumstances:
            </p>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Service Providers:</p>
              <p className="mb-2">
                We share information with trusted third-party service providers who help us operate our platform, including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Cloud hosting and infrastructure providers</li>
                <li>Payment processors and billing services</li>
                <li>Email delivery and communication services</li>
                <li>Analytics and performance monitoring tools</li>
                <li>Customer support and helpdesk platforms</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Legal Requirements:</p>
              <p>
                We may disclose information if required by law, court order, or governmental regulation, or to protect our rights, property, or safety.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Business Transfers:</p>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#111827] mb-2">With Your Consent:</p>
              <p>
                We may share information with third parties when you explicitly consent to such sharing.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="size-5 text-orange-600" />
            <h3 className="font-bold text-lg text-[#111827]">4. Cookies and Tracking Technologies</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              We use cookies and similar tracking technologies to enhance your experience, analyze usage, and personalize content. Cookies are small data files stored on your device.
            </p>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Types of Cookies We Use:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><span className="font-semibold text-[#111827]">Essential Cookies:</span> Required for the platform to function properly</li>
                <li><span className="font-semibold text-[#111827]">Performance Cookies:</span> Help us understand how users interact with our platform</li>
                <li><span className="font-semibold text-[#111827]">Functional Cookies:</span> Remember your preferences and settings</li>
                <li><span className="font-semibold text-[#111827]">Marketing Cookies:</span> Used to deliver relevant advertisements</li>
              </ul>
            </div>
            <p>
              You can control cookies through your browser settings, but disabling certain cookies may limit platform functionality.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="size-5 text-green-600" />
            <h3 className="font-bold text-lg text-[#111827]">5. Data Security</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              We implement industry-standard security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
            </p>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Our Security Measures Include:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Encrypted storage of sensitive information</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure backup and disaster recovery procedures</li>
                <li>Employee training on data protection practices</li>
              </ul>
            </div>
            <p>
              While we strive to protect your information, no method of transmission over the internet is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="size-5 text-blue-600" />
            <h3 className="font-bold text-lg text-[#111827]">6. Your Privacy Rights</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p className="font-semibold text-[#111827]">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="font-semibold text-[#111827]">Access:</span> Request a copy of the personal information we hold about you</li>
              <li><span className="font-semibold text-[#111827]">Correction:</span> Request corrections to inaccurate or incomplete information</li>
              <li><span className="font-semibold text-[#111827]">Deletion:</span> Request deletion of your personal information (subject to legal requirements)</li>
              <li><span className="font-semibold text-[#111827]">Data Portability:</span> Request your data in a machine-readable format</li>
              <li><span className="font-semibold text-[#111827]">Opt-Out:</span> Unsubscribe from marketing communications at any time</li>
              <li><span className="font-semibold text-[#111827]">Object:</span> Object to certain types of data processing</li>
              <li><span className="font-semibold text-[#111827]">Restrict:</span> Request restriction of processing in certain circumstances</li>
            </ul>
            <p>
              To exercise your rights, contact us at privacy@company.com. We will respond to your request within 30 days.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Database className="size-5 text-purple-600" />
            <h3 className="font-bold text-lg text-[#111827]">7. Data Retention</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations.
            </p>
            <div>
              <p className="font-semibold text-[#111827] mb-2">Retention Periods:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Account information: Duration of account plus 5 years</li>
                <li>Transaction records: 7 years (tax and legal requirements)</li>
                <li>Usage data and logs: 2 years</li>
                <li>Marketing communications: Until you opt-out</li>
                <li>Support tickets: 3 years after resolution</li>
              </ul>
            </div>
            <p>
              After the retention period, we securely delete or anonymize your information.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="size-5 text-orange-600" />
            <h3 className="font-bold text-lg text-[#111827]">8. Children's Privacy</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children.
            </p>
            <p>
              If you believe a child has provided us with personal information, please contact us immediately, and we will delete such information from our systems.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="size-5 text-blue-600" />
            <h3 className="font-bold text-lg text-[#111827]">9. International Data Transfers</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.
            </p>
            <p>
              We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy, including standard contractual clauses and adequacy decisions.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="size-5 text-green-600" />
            <h3 className="font-bold text-lg text-[#111827]">10. Changes to Privacy Policy</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
            </p>
            <p>
              Material changes will be communicated via email or prominent notice on our platform at least 30 days before taking effect. Continued use of our services after changes become effective constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="size-5 text-purple-600" />
            <h3 className="font-bold text-lg text-[#111827]">11. Third-Party Links</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites.
            </p>
            <p>
              We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-6 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Shield className="size-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-[#111827] mb-2">Contact Us</h3>
              <p className="text-sm text-[#6B7280] mb-3">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Officer:
              </p>
              <div className="space-y-1 text-sm text-[#6B7280]">
                <p>Email: privacy@company.com</p>
                <p>Phone: +63 2 8888 8888</p>
                <p>Address: 123 Business Street, Makati City, Metro Manila, Philippines</p>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-3">
                Data Protection Officer: compliance@company.com
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[24px] p-6 border border-green-200">
          <p className="text-sm text-[#6B7280] text-center">
            By using our services, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
          </p>
        </div>
      </main>
    </div>
  );
}
