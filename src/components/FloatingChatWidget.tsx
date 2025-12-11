import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface FloatingChatWidgetProps {
  chatSlug?: string; // Chatbot slug (e.g., '6ee15dca0e')
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

/**
 * Floating Chat Widget Component
 * 
 * Displays a floating chat icon with text that opens a side modal when clicked.
 * Can be used on non-authenticated pages (login, signup, landing pages).
 * 
 * @param chatSlug - The chatbot slug/ID to open (defaults to '6ee15dca0e')
 * @param position - Position of the widget (defaults to 'bottom-right')
 * @param primaryColor - Primary color for the widget (defaults to '#3B82F6')
 */
export default function FloatingChatWidget({
  chatSlug = '6ee15dca0e',
  position = 'bottom-right',
  primaryColor = '#3B82F6'
}: FloatingChatWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenChat = () => {
    setIsModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsModalOpen(false);
  };

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'bottom-6 left-6';

  const chatUrl = `/chat/${chatSlug}`;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={handleOpenChat}
        className={`fixed ${positionClasses} z-50 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 px-4 py-3 flex items-center gap-3 hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95 group`}
        style={{ borderColor: primaryColor }}
        aria-label="Open chat"
      >
        {/* Icon */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {/* Pulse animation */}
          <span className="absolute w-12 h-12 rounded-full animate-ping opacity-20" style={{ backgroundColor: primaryColor }}></span>
        </div>

        {/* Text */}
        <div className="text-left max-w-[200px]">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            👋 Hi there!
          </p>
          <p className="text-xs text-gray-600 leading-tight mt-0.5">
            I'm NexScout AI Assistant. How can I help you today?
          </p>
        </div>
      </button>

      {/* Side Modal */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
            onClick={handleCloseChat}
          />

          {/* Side Modal */}
          <div 
            className={`fixed top-0 ${position === 'bottom-right' ? 'right-0' : 'left-0'} h-full w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out`}
            style={{ transform: isModalOpen ? 'translateX(0)' : `translateX(${position === 'bottom-right' ? '100%' : '-100%'})` }}
          >
            {/* Modal Header */}
            <div 
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-semibold text-base">NexScout AI Assistant</span>
              </div>
              <button
                onClick={handleCloseChat}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Iframe */}
            <div className="h-[calc(100vh-73px)] w-full">
              <iframe
                src={chatUrl}
                className="w-full h-full border-0"
                title="NexScout AI Chat"
                allow="microphone; camera"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

