import React, { useEffect, useState } from 'react';
import { InChatUpgradeNudge } from './InChatUpgradeNudge';
import { useDynamicNudges } from '../hooks/useDynamicNudges';
import { useSubscription } from '../hooks/useSubscription';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';

interface ChatbotNudgeWrapperProps {
  messageCount: number;
  lastMessage?: string;
  children: React.ReactNode;
}

export function ChatbotNudgeWrapper({ messageCount, lastMessage, children }: ChatbotNudgeWrapperProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { tier } = useSubscription();
  const {
    activeOffer,
    generateOffer,
    updateEmotionalState,
    trackMetric,
  } = useDynamicNudges();

  const [showNudge, setShowNudge] = useState(false);
  const [nudgeVariant, setNudgeVariant] = useState<'minimal' | 'expanded' | 'urgent'>('minimal');

  useEffect(() => {
    if (tier !== 'FREE' || !user?.id) return;

    analyzeAndShowNudge();
  }, [messageCount, tier, user?.id]);

  useEffect(() => {
    if (lastMessage) {
      const emotion = detectEmotionFromMessage(lastMessage);
      if (emotion) {
        updateEmotionalState(emotion);
      }
    }
  }, [lastMessage]);

  const analyzeAndShowNudge = async () => {
    if (tier !== 'FREE') return;

    await trackMetric('chatbot_message', messageCount);

    if (messageCount === 3) {
      setNudgeVariant('minimal');
      await generateOffer(499, 'PRO');
      setShowNudge(true);
    }

    if (messageCount === 7) {
      setNudgeVariant('expanded');
      await generateOffer(499, 'PRO');
      setShowNudge(true);
    }

    if (messageCount >= 10) {
      setNudgeVariant('urgent');
      await generateOffer(499, 'PRO', { hasSurge: true });
      setShowNudge(true);
    }
  };

  const detectEmotionFromMessage = (message: string): any => {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('frustrated') ||
      lowerMessage.includes('annoying') ||
      lowerMessage.includes('problem') ||
      lowerMessage.includes('issue')
    ) {
      return 'frustrated';
    }

    if (
      lowerMessage.includes('excited') ||
      lowerMessage.includes('amazing') ||
      lowerMessage.includes('love') ||
      lowerMessage.includes('great')
    ) {
      return 'excited';
    }

    if (
      lowerMessage.includes('help') ||
      lowerMessage.includes('confused') ||
      lowerMessage.includes('how do')
    ) {
      return 'overwhelmed';
    }

    if (lowerMessage.includes('curious') || lowerMessage.includes('interested')) {
      return 'curious';
    }

    if (
      lowerMessage.includes('sold') ||
      lowerMessage.includes('closed') ||
      lowerMessage.includes('deal')
    ) {
      return 'confident';
    }

    return null;
  };

  const handleUpgrade = () => {
    navigate('/subscription-checkout?tier=PRO');
    setShowNudge(false);
  };

  const handleDismiss = async () => {
    setShowNudge(false);
    await trackMetric('nudge_dismissed', { context: 'chatbot', messageCount });
  };

  return (
    <div className="chatbot-nudge-wrapper">
      {children}

      {tier === 'FREE' && showNudge && activeOffer && (
        <div className="mt-3">
          <InChatUpgradeNudge
            offer={activeOffer}
            variant={nudgeVariant}
            onUpgrade={handleUpgrade}
            onDismiss={handleDismiss}
          />
        </div>
      )}
    </div>
  );
}
