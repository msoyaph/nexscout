import { ArrowLeft, FileText, Shield, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TermsOfServicePageProps {
  onNavigateBack: () => void;
}

export default function TermsOfServicePage({ onNavigateBack }: TermsOfServicePageProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.email === 'geoffmax22@gmail.com';
  
  // Handle case when useAuth might not be available (public route)
  const safeUser = user || null;
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
          <h1 className="text-lg font-semibold text-gray-900">Terms of Service</h1>
          <div className="size-11" />
        </div>
      </header>

      <main className="px-6 mt-6 space-y-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <FileText className="size-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-[#111827] mb-2">Agreement to Terms</h2>
              <p className="text-sm text-[#6B7280]">
                By accessing and using our AI-powered sales platform, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">1. Acceptance of Terms</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              These Terms of Service constitute a legally binding agreement between you and our company regarding your use of the platform and services. By creating an account, accessing, or using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.
            </p>
            <p>
              If you do not agree with any part of these terms, you must immediately discontinue use of our services.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">2. User Accounts</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              <span className="font-semibold text-[#111827]">Account Creation:</span> You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Account Security:</span> You agree to immediately notify us of any unauthorized access or security breach. We are not liable for any loss or damage arising from your failure to protect your account information.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Account Termination:</span> We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent, abusive, or illegal activities.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">3. Subscription and Payments</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              <span className="font-semibold text-[#111827]">Billing:</span> Subscription fees are billed in advance on a monthly or annual basis depending on your chosen plan. All fees are in Philippine Peso (PHP) unless otherwise stated.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Auto-Renewal:</span> Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date. You authorize us to charge your payment method for renewal fees.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Refund Policy:</span> All subscription payments are non-refundable. Cancellations prevent future charges but do not provide refunds for the current period.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Price Changes:</span> We reserve the right to modify subscription prices with 30 days advance notice. Price changes will not affect your current billing period.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">4. Coin Economy System</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              <span className="font-semibold text-[#111827]">Purchased Coins:</span> Coins purchased with real money do not expire and remain in your account even after subscription cancellation.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Bonus Coins:</span> Weekly bonus coins provided as part of subscription plans expire when your subscription ends or is downgraded.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Non-Transferable:</span> Coins cannot be transferred between accounts, exchanged for cash, or refunded except as required by law.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">5. AI Services and Content</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              <span className="font-semibold text-[#111827]">AI-Generated Content:</span> Our AI features provide suggestions and insights based on data analysis. While we strive for accuracy, AI-generated content may contain errors or inaccuracies.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">User Responsibility:</span> You are solely responsible for reviewing, verifying, and using AI-generated content appropriately. We are not liable for any consequences arising from your reliance on AI outputs.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Service Availability:</span> We aim for 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance and updates may temporarily limit service availability.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">6. Acceptable Use Policy</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p className="font-semibold text-[#111827]">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Use the service for illegal, fraudulent, or unauthorized purposes</li>
              <li>Harass, abuse, or harm other users or third parties</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems or data</li>
              <li>Scrape, copy, or reverse engineer our platform without permission</li>
              <li>Resell or redistribute our services without authorization</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Spam, send unsolicited communications, or engage in similar activities</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">7. Intellectual Property</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              <span className="font-semibold text-[#111827]">Our Rights:</span> All content, features, and functionality of our platform, including but not limited to text, graphics, logos, software, and AI models, are owned by us and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">Your Content:</span> You retain ownership of content you create or upload. By using our services, you grant us a worldwide, non-exclusive license to use, store, and process your content to provide and improve our services.
            </p>
            <p>
              <span className="font-semibold text-[#111827]">AI Training:</span> We may use anonymized, aggregated data to improve our AI models and services, but will not share your personal or identifiable information without consent.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">8. Data Privacy</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms of Service by reference.
            </p>
            <p>
              By using our services, you consent to the collection and use of your information as described in the Privacy Policy.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">9. Limitation of Liability</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use or inability to use our services.
            </p>
            <p>
              Our total liability for any claims related to the services shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">10. Disclaimers</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              Our services are provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p>
              We do not guarantee that our services will be error-free, secure, or uninterrupted. You use our services at your own risk.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">11. Modifications to Terms</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              We reserve the right to modify these Terms of Service at any time. Material changes will be communicated via email or in-app notification at least 30 days before taking effect.
            </p>
            <p>
              Continued use of our services after changes become effective constitutes acceptance of the modified terms.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-lg text-[#111827] mb-4">12. Governing Law</h3>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of the Philippines, without regard to its conflict of law provisions.
            </p>
            <p>
              Any disputes arising from these terms or your use of our services shall be subject to the exclusive jurisdiction of the courts of the Philippines.
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-[24px] p-6 border-2 border-orange-200">
            <div className="flex items-start gap-4">
              <AlertCircle className="size-6 text-orange-600 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#111827] mb-2">Contact Information</h3>
                <p className="text-sm text-[#6B7280] mb-2">
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-1 text-sm text-[#6B7280]">
                  <p>Email: legal@company.com</p>
                  <p>Phone: +63 2 8888 8888</p>
                  <p>Address: 123 Business Street, Makati City, Metro Manila, Philippines</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
