import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import OnboardingStep1 from './OnboardingStep1';
import OnboardingStep2 from './OnboardingStep2';
import OnboardingStep3 from './OnboardingStep3';
import AIScanningPage from '../AIScanningPage';
import ProspectsPreviewPage from '../ProspectsPreviewPage';

interface OnboardingData {
  role: string;
  goals: string[];
  connectedPlatforms: string[];
}

interface OnboardingFlowProps {
  onComplete: (data?: OnboardingData) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [showScanning, setShowScanning] = useState(false);
  const [showProspectsPreview, setShowProspectsPreview] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    role: '',
    goals: [] as string[],
    connectedPlatforms: [] as string[],
  });

  const handleStep1Next = (role: string) => {
    setOnboardingData({ ...onboardingData, role });
    setStep(2);
  };

  const handleStep2Next = (goals: string[]) => {
    setOnboardingData({ ...onboardingData, goals });
    setStep(3);
  };

  const handleStep2Back = () => {
    setStep(1);
  };

  const handleStep3Back = () => {
    setStep(2);
  };

  const handleFinish = async (connectedPlatforms: string[]) => {
    const finalData = { ...onboardingData, connectedPlatforms };

    if (connectedPlatforms.includes('facebook')) {
      setOnboardingData(finalData);
      setShowScanning(true);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({
            profession: finalData.role,
            onboarding_completed: true,
            onboarding_step: 'completed',
          })
          .eq('id', user.id);

        onComplete();
      } else {
        onComplete(finalData);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(finalData);
    }
  };

  const handleScanningComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({
            profession: onboardingData.role,
            onboarding_completed: true,
            onboarding_step: 'completed',
          })
          .eq('id', user.id);

        onComplete();
      } catch (error) {
        console.error('Error completing onboarding:', error);
        onComplete();
      }
    } else {
      setShowScanning(false);
      setShowProspectsPreview(true);
    }
  };

  const handleCreateAccount = () => {
    onComplete(onboardingData);
  };

  const handleBackFromPreview = () => {
    setShowProspectsPreview(false);
    setStep(3);
  };

  const handleSkip = async () => {
    const finalData = { ...onboardingData, connectedPlatforms: [] };

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({
            profession: finalData.role,
            onboarding_completed: true,
            onboarding_step: 'completed',
          })
          .eq('id', user.id);

        onComplete();
      } else {
        onComplete(finalData);
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      onComplete(finalData);
    }
  };

  if (showScanning) {
    return <AIScanningPage onComplete={handleScanningComplete} />;
  }

  if (showProspectsPreview) {
    return (
      <ProspectsPreviewPage
        onCreateAccount={handleCreateAccount}
        onBack={handleBackFromPreview}
      />
    );
  }

  if (step === 1) {
    return <OnboardingStep1 onNext={handleStep1Next} />;
  }

  if (step === 2) {
    return <OnboardingStep2 onNext={handleStep2Next} onBack={handleStep2Back} />;
  }

  if (step === 3) {
    return (
      <OnboardingStep3
        onFinish={handleFinish}
        onSkip={handleSkip}
        onBack={handleStep3Back}
      />
    );
  }

  return null;
}
