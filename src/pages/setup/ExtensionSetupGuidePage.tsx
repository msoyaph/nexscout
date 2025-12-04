import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Chrome,
  Zap,
  Shield,
  Target,
  Facebook,
  Instagram,
  Linkedin,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Users,
  Eye,
  Lock,
} from 'lucide-react';

const EXTENSION_DOWNLOAD_URL = import.meta.env.VITE_EXTENSION_URL || '#';

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer, isOpen, onToggle }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
    >
      <span className="font-medium text-gray-900 text-left">{question}</span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-gray-700 whitespace-pre-line">{answer}</p>
      </div>
    )}
  </div>
);

interface ExtensionSetupGuidePageProps {
  onNavigate?: (page: string) => void;
}

const ExtensionSetupGuidePage: React.FC<ExtensionSetupGuidePageProps> = ({ onNavigate }) => {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const benefits = [
    {
      icon: Zap,
      title: 'Real-Time Capture',
      description: 'Capture friends lists, comments, posts with one click.',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: Target,
      title: 'Better AI Accuracy',
      description: 'Extension captures HTML + relationships → more accurate ScoutScore.',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      icon: Sparkles,
      title: 'Auto-Tag Prospects',
      description: 'Tag Warm Market / OFW / Business Owner while capturing.',
      gradient: 'from-pink-500 to-pink-600',
    },
    {
      icon: Lock,
      title: '100% Private',
      description: 'Your data stays on your device until YOU submit it.',
      gradient: 'from-green-500 to-green-600',
    },
  ];

  const captureTypes = [
    { icon: Users, label: 'Capture Friends Lists', color: 'bg-blue-500' },
    { icon: MessageSquare, label: 'Capture Post Feeds', color: 'bg-purple-500' },
    { icon: Facebook, label: 'Capture Comments', color: 'bg-pink-500' },
    { icon: Eye, label: 'Capture Groups / People Tabs', color: 'bg-green-500' },
  ];

  const troubleshootingItems = [
    {
      question: 'Extension not appearing?',
      answer: `1. Open chrome://extensions in your browser\n2. Make sure the extension is enabled (toggle switch is ON)\n3. Pin the extension to your toolbar by clicking the puzzle icon\n4. Refresh the page and try again`,
    },
    {
      question: 'Capture button not working?',
      answer: `1. Make sure you're logged into NexScout\n2. Check that the extension is connected to your account\n3. Try refreshing the page\n4. If still not working, reinstall the extension`,
    },
    {
      question: 'Chrome blocked the file?',
      answer: `1. Click "Keep" when Chrome shows the warning\n2. Go to chrome://extensions\n3. Enable "Developer mode" in the top right\n4. The extension will be allowed to install`,
    },
    {
      question: 'Error: Missing user token?',
      answer: `1. Click the NexScout extension icon\n2. Click "Connect to NexScout"\n3. Log in to your account\n4. Confirm the account linking\n5. The token will be automatically set`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {onNavigate && (
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Chrome className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Install the NexScout Chrome Extension
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock 10× Smarter Prospect Scanning
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${benefit.gradient} rounded-lg mb-4 shadow-sm`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-center mb-12 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Download the official NexScout Chrome Extension and start capturing prospects in seconds.
          </p>
          <a
            href={EXTENSION_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto justify-center"
          >
            <Download className="w-6 h-6" />
            Download Extension
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 mb-12 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Step-by-Step Installation Guide
          </h2>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Download the Extension</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Click the "Download Extension" button above</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>If Chrome warns you, click "Keep" to proceed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>
                      Open <code className="bg-gray-100 px-2 py-1 rounded">chrome://extensions</code>
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Enable Developer Mode</h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Chrome className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Screenshot: Developer Mode Toggle</p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Open Chrome Extensions page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Toggle "Developer Mode" ON in the top right corner</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Install the Extension</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Drag the .crx or .zip folder into the Chrome Extensions page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Click "Add extension" when prompted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>The NexScout icon will appear in your toolbar</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect to NexScout</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Click the NexScout icon in your browser toolbar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Click "Connect to NexScout"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Log in to your NexScout account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Confirm account linking</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  5
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Start Capturing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {captureTypes.map((capture, index) => {
                    const Icon = capture.icon;
                    return (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`${capture.color} p-2 rounded-lg`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{capture.label}</span>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Capture Now
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-12 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            How to Use The Captured Data
          </h2>
          <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-700 mb-2">
                  Your captures will appear inside:
                  <br />
                  <span className="font-semibold text-blue-600">
                    Smart Scanner → Recent Browser Captures
                  </span>
                </p>
                <p className="text-gray-600 text-sm">
                  You can run a scan every time you capture new pages to get instant AI insights.
                </p>
              </div>
            </div>
          </div>
          {onNavigate && (
            <div className="text-center">
              <button
                onClick={() => onNavigate('my-captured-data')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-5 h-5" />
                View My Captured Data
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Troubleshooting</h2>
          <div className="space-y-3">
            {troubleshootingItems.map((item, index) => (
              <AccordionItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openAccordion === index}
                onToggle={() => setOpenAccordion(openAccordion === index ? null : index)}
              />
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200">
          <Shield className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            NexScout never accesses your social media accounts. Only data YOU choose to capture is
            analyzed. Your privacy and security are our top priorities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExtensionSetupGuidePage;
