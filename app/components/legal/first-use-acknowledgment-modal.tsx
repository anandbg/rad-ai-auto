'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/shared/cn';
import { Button } from '@/components/ui/button';

interface FirstUseAcknowledgmentModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

// Animation variants for overlay
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

// Animation variants for content
const contentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

export function FirstUseAcknowledgmentModal({ open, onAcknowledge }: FirstUseAcknowledgmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleAcknowledge = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/acknowledge-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to save acknowledgment');
      }

      onAcknowledge();
    } catch (err) {
      setError('Failed to save. Please try again.');
      setIsLoading(false);
    }
  };

  // Prevent escape key from closing
  const handleEscapeKeyDown = (event: KeyboardEvent) => {
    event.preventDefault();
  };

  // Prevent clicking outside from closing
  const handleInteractOutside = (event: Event) => {
    event.preventDefault();
  };

  const contentClassName = cn(
    'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border-t-4 border-t-amber-500 border border-border bg-surface shadow-xl focus-visible:outline-none'
  );

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        {shouldReduceMotion ? (
          <>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <DialogPrimitive.Content
                className={contentClassName}
                onEscapeKeyDown={handleEscapeKeyDown}
                onInteractOutside={handleInteractOutside}
              >
                <ModalContent
                  isLoading={isLoading}
                  error={error}
                  onAcknowledge={handleAcknowledge}
                />
              </DialogPrimitive.Content>
            </div>
          </>
        ) : (
          <>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <DialogPrimitive.Content
                asChild
                onEscapeKeyDown={handleEscapeKeyDown}
                onInteractOutside={handleInteractOutside}
              >
                <motion.div
                  className={contentClassName}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.15 }}
                >
                  <ModalContent
                    isLoading={isLoading}
                    error={error}
                    onAcknowledge={handleAcknowledge}
                  />
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </>
        )}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface ModalContentProps {
  isLoading: boolean;
  error: string | null;
  onAcknowledge: () => void;
}

function ModalContent({ isLoading, error, onAcknowledge }: ModalContentProps) {
  return (
    <div className="p-6">
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          Important: Read Before Continuing
        </h2>
      </div>

      {/* Body text */}
      <div className="space-y-4 text-sm text-text-secondary">
        <p>
          This is an AI drafting tool designed to assist licensed healthcare professionals.
        </p>

        <p className="font-medium text-text-primary">
          By continuing, I acknowledge and understand that:
        </p>

        <ul className="space-y-2 list-disc list-inside">
          <li>I am solely responsible for reviewing and verifying all AI-generated content</li>
          <li>This tool is not a medical device and does not provide medical advice</li>
          <li>I must not input any patient-identifiable or personal information</li>
          <li>The owners and operators accept no responsibility for any clinical decisions made using this tool</li>
          <li>All content is provided &quot;as-is&quot; without warranties of any kind</li>
        </ul>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Action button */}
      <div className="mt-6">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onAcknowledge}
          isLoading={isLoading}
          disabled={isLoading}
        >
          I Understand and Accept
        </Button>

        <p className="mt-3 text-center text-xs text-text-secondary">
          You will only see this message once.
        </p>
      </div>
    </div>
  );
}
