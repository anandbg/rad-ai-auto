'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';
import { usePreferences } from '@/lib/preferences/preferences-context';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  highlight: string;
  action?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome to AI Radiologist!',
    description: 'Let\'s take a quick tour of the app to help you get started. This interactive tutorial will guide you through the main features.',
    icon: '👋',
    highlight: 'welcome',
  },
  {
    id: 2,
    title: 'Transcribe Audio',
    description: 'Record or upload audio files to transcribe your dictations. Use the microphone button to start recording, or drag and drop an audio file.',
    icon: '🎤',
    highlight: 'transcribe',
    action: 'Try recording a quick note',
  },
  {
    id: 3,
    title: 'Generate Reports',
    description: 'Select a template and enter your findings to generate AI-powered radiology reports. The AI will format your notes into a professional report.',
    icon: '📝',
    highlight: 'generate',
    action: 'Generate your first report',
  },
  {
    id: 4,
    title: 'Manage Templates',
    description: 'Browse and customize report templates. You can create your own templates or clone from the global library.',
    icon: '📋',
    highlight: 'templates',
    action: 'Explore the template library',
  },
  {
    id: 5,
    title: 'Create Macros',
    description: 'Set up text expansion macros to speed up your workflow. Type a shortcut and it will expand to the full text.',
    icon: '⚡',
    highlight: 'macros',
    action: 'Create a macro',
  },
  {
    id: 6,
    title: 'YOLO Mode',
    description: 'Enable YOLO mode for the fastest workflow! The AI will auto-detect the modality and select the best template for you.',
    icon: '🚀',
    highlight: 'yolo',
    action: 'Enable YOLO mode',
  },
  {
    id: 7,
    title: 'You\'re All Set!',
    description: 'You\'re ready to start using AI Radiologist. If you need help later, you can access the tutorial again from Settings.',
    icon: '🎉',
    highlight: 'complete',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { preferences, updatePreference } = usePreferences();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Redirect if onboarding already completed
  useEffect(() => {
    if (preferences.onboardingCompleted) {
      // Allow users to view the tutorial again, but show a message
    }
  }, [preferences.onboardingCompleted]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSkip = async () => {
    await updatePreference('onboardingCompleted', true);
    router.push('/dashboard');
  };

  const handleComplete = async () => {
    await updatePreference('onboardingCompleted', true);
    router.push('/dashboard');
  };

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  // Guard against undefined step (shouldn't happen but TypeScript requires it)
  if (!step) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface to-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
              data-testid="onboarding-progress"
            />
          </div>
          <div className="mt-2 text-sm text-text-secondary text-center">
            Step {currentStep + 1} of {tutorialSteps.length}
          </div>
        </div>

        {/* Main card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header with icon */}
            <div className="bg-primary/5 p-8 text-center border-b border-border">
              <div
                className={`text-6xl mb-4 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
              >
                {step.icon}
              </div>
              <h1
                className={`text-2xl font-bold text-text-primary transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                data-testid="onboarding-title"
              >
                {step.title}
              </h1>
            </div>

            {/* Content */}
            <div className="p-8">
              <p
                className={`text-text-secondary text-center text-lg leading-relaxed transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                data-testid="onboarding-description"
              >
                {step.description}
              </p>

              {step.action && (
                <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/30 text-center">
                  <p className="text-sm text-info font-medium">
                    💡 Suggested action: {step.action}
                  </p>
                </div>
              )}

              {/* Step indicators */}
              <div className="flex justify-center gap-2 mt-8">
                {tutorialSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentStep(index);
                        setIsAnimating(false);
                      }, 200);
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentStep
                        ? 'bg-primary scale-125'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-surface-secondary'
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                    data-testid={`step-indicator-${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Footer with buttons */}
            <div className="p-6 border-t border-border bg-surface-secondary/50 flex items-center justify-between">
              <div>
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={isAnimating}
                    data-testid="onboarding-previous"
                  >
                    ← Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!isLastStep && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-text-muted"
                    data-testid="onboarding-skip"
                  >
                    Skip Tutorial
                  </Button>
                )}

                {isLastStep ? (
                  <Button
                    onClick={handleComplete}
                    disabled={isAnimating}
                    data-testid="onboarding-complete"
                  >
                    Get Started →
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={isAnimating}
                    data-testid="onboarding-next"
                  >
                    Next →
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome message for returning users */}
        {preferences.onboardingCompleted && (
          <div className="mt-4 text-center text-sm text-text-muted">
            You&apos;ve already completed the tutorial.{' '}
            <button
              onClick={() => router.push('/dashboard')}
              className="text-primary hover:underline"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* User greeting */}
        {user && (
          <div className="mt-6 text-center text-sm text-text-secondary">
            Welcome, <span className="font-medium text-text-primary">{user.name}</span>!
          </div>
        )}
      </div>
    </div>
  );
}
