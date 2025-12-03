import { ArrowLeft, Target, Zap, Users, Heart, Award, TrendingUp, Lightbulb, Shield } from 'lucide-react';

interface AboutPageProps {
  onNavigateBack: () => void;
}

export default function AboutPage({ onNavigateBack }: AboutPageProps) {
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
          <h1 className="text-lg font-semibold text-gray-900">About</h1>
          <div className="size-11" />
        </div>
      </header>

      <main className="px-6 mt-6 space-y-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[24px] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Zap className="size-7 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-2xl">Our Mission</h2>
              <p className="text-sm text-blue-100">Transforming sales through AI innovation</p>
            </div>
          </div>
          <p className="text-base leading-relaxed">
            We're on a mission to revolutionize the way sales professionals connect with prospects by leveraging cutting-edge artificial intelligence. Our platform empowers teams to build meaningful relationships, close deals faster, and achieve unprecedented success through data-driven insights and intelligent automation.
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Target className="size-6 text-blue-600" />
            <h3 className="font-bold text-lg text-[#111827]">Our Story</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              Founded in 2023, our company was born from a simple observation: sales professionals spend too much time on repetitive tasks and not enough time building genuine connections with prospects.
            </p>
            <p>
              Our founding team, comprised of experienced sales leaders and AI engineers, came together with a shared vision to create a platform that would fundamentally change how sales teams operate. We believed that by combining the power of artificial intelligence with human intuition and expertise, we could help sales professionals achieve more in less time.
            </p>
            <p>
              Today, we serve thousands of sales professionals across various industries, from insurance and real estate to MLM and direct sales. Our platform has helped teams close millions in deals and build lasting relationships with their prospects.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="size-6 text-orange-600" />
            <h3 className="font-bold text-lg text-[#111827]">What We Do</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Zap className="size-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#111827] mb-1">AI-Powered Insights</h4>
                <p className="text-sm text-[#6B7280]">
                  Our advanced AI algorithms analyze prospect data to provide actionable insights, helping you understand personality types, communication preferences, and the best approach for each prospect.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="size-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#111827] mb-1">Intelligent Automation</h4>
                <p className="text-sm text-[#6B7280]">
                  Automate repetitive tasks like message sequencing and follow-ups, freeing you to focus on what matters most: building relationships and closing deals.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Users className="size-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#111827] mb-1">Team Collaboration</h4>
                <p className="text-sm text-[#6B7280]">
                  Enable seamless collaboration with shared pipelines, team dashboards, and performance tracking that keeps everyone aligned and motivated.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Shield className="size-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#111827] mb-1">Data Security</h4>
                <p className="text-sm text-[#6B7280]">
                  Your data is protected with enterprise-grade security measures, including encryption, secure backups, and compliance with international data protection standards.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[24px] p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="size-6 text-purple-600" />
            <h3 className="font-bold text-lg text-[#111827]">Our Values</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 rounded-[16px] p-4">
              <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Shield className="size-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-sm text-[#111827] mb-1">Integrity</h4>
              <p className="text-xs text-[#6B7280]">We operate with honesty and transparency in everything we do</p>
            </div>

            <div className="bg-white/80 rounded-[16px] p-4">
              <div className="size-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Lightbulb className="size-4 text-green-600" />
              </div>
              <h4 className="font-semibold text-sm text-[#111827] mb-1">Innovation</h4>
              <p className="text-xs text-[#6B7280]">We continuously push boundaries to create better solutions</p>
            </div>

            <div className="bg-white/80 rounded-[16px] p-4">
              <div className="size-8 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                <Users className="size-4 text-purple-600" />
              </div>
              <h4 className="font-semibold text-sm text-[#111827] mb-1">Customer First</h4>
              <p className="text-xs text-[#6B7280]">Your success is our success, and we're committed to helping you win</p>
            </div>

            <div className="bg-white/80 rounded-[16px] p-4">
              <div className="size-8 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <Award className="size-4 text-orange-600" />
              </div>
              <h4 className="font-semibold text-sm text-[#111827] mb-1">Excellence</h4>
              <p className="text-xs text-[#6B7280]">We strive for the highest quality in our products and services</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Award className="size-6 text-blue-600" />
            <h3 className="font-bold text-lg text-[#111827]">Our Achievements</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-[16px]">
              <div className="text-3xl font-bold text-blue-600 mb-1">10K+</div>
              <div className="text-xs text-[#6B7280]">Active Users</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-[16px]">
              <div className="text-3xl font-bold text-green-600 mb-1">1M+</div>
              <div className="text-xs text-[#6B7280]">AI Scans Completed</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-[16px]">
              <div className="text-3xl font-bold text-purple-600 mb-1">95%</div>
              <div className="text-xs text-[#6B7280]">Customer Satisfaction</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-[16px]">
              <div className="text-3xl font-bold text-orange-600 mb-1">24/7</div>
              <div className="text-xs text-[#6B7280]">Support Available</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Users className="size-6 text-green-600" />
            <h3 className="font-bold text-lg text-[#111827]">Who We Serve</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              Our platform is designed for ambitious sales professionals across various industries:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="font-semibold text-[#111827]">Insurance Agents:</span> Build trust and close policies faster with personalized insights</li>
              <li><span className="font-semibold text-[#111827]">Real Estate Professionals:</span> Match properties with prospects based on AI-driven compatibility</li>
              <li><span className="font-semibold text-[#111827]">MLM Distributors:</span> Expand your network and recruit effectively with data-driven strategies</li>
              <li><span className="font-semibold text-[#111827]">Financial Advisors:</span> Connect with prospects on a deeper level and provide tailored solutions</li>
              <li><span className="font-semibold text-[#111827]">Direct Sales Teams:</span> Streamline your process and maximize conversion rates</li>
              <li><span className="font-semibold text-[#111827]">B2B Sales:</span> Navigate complex sales cycles with intelligent prospect insights</li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="size-6 text-blue-600" />
            <h3 className="font-bold text-lg text-[#111827]">Our Vision for the Future</h3>
          </div>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            We envision a future where every sales professional has access to enterprise-level AI tools that level the playing field and enable anyone to succeed, regardless of their background or resources. We're committed to continuous innovation, expanding our AI capabilities, and building features that truly make a difference in how you connect with prospects and close deals.
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="size-6 text-red-600" />
            <h3 className="font-bold text-lg text-[#111827]">Join Our Journey</h3>
          </div>
          <div className="space-y-3 text-sm text-[#6B7280]">
            <p>
              Whether you're just starting out in sales or you're a seasoned professional looking to take your game to the next level, we're here to support your journey.
            </p>
            <p>
              Join thousands of successful sales professionals who trust our platform to help them achieve their goals. Together, we're not just changing how sales is done—we're transforming lives and building a community of empowered, successful professionals.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[24px] p-6 border-2 border-green-200">
          <div className="text-center">
            <div className="size-14 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4">
              <Users className="size-7 text-white" />
            </div>
            <h3 className="font-bold text-lg text-[#111827] mb-2">Get in Touch</h3>
            <p className="text-sm text-[#6B7280] mb-4">
              Have questions or want to learn more? We'd love to hear from you.
            </p>
            <div className="space-y-2 text-sm text-[#6B7280]">
              <p>Email: hello@company.com</p>
              <p>Phone: +63 2 8888 8888</p>
              <p>Address: 123 Business Street, Makati City, Metro Manila, Philippines</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
