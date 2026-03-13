'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';

const STEPS = [
  {
    icon: '🎮',
    titleKey: 'onboarding.step1.title',
    descKey: 'onboarding.step1.desc',
  },
  {
    icon: '🏆',
    titleKey: 'onboarding.step2.title',
    descKey: 'onboarding.step2.desc',
  },
  {
    icon: '⭐',
    titleKey: 'onboarding.step3.title',
    descKey: 'onboarding.step3.desc',
  },
];

export function OnboardingModal() {
  const { showOnboarding, xpJustAwarded, completeOnboarding } = useOnboarding();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    await completeOnboarding();
    addNotification({
      type: 'badge',
      title: t('onboarding.welcomeTitle') || 'Welcome!',
      message: t('onboarding.xpBonus') || '+50 XP bonus awarded!',
      points: 50,
      icon: '🎉',
    });
  };

  if (!showOnboarding) return null;

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden"
        >
          {/* Progress dots */}
          <div className="flex gap-2 justify-center pt-5 pb-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-gray-900 dark:bg-white'
                    : i < step
                    ? 'w-2 bg-gray-400'
                    : 'w-2 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="px-8 py-6 text-center"
            >
              <div className="text-6xl mb-4">{currentStep.icon}</div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                {t(currentStep.titleKey) || currentStep.titleKey}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t(currentStep.descKey) || currentStep.descKey}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* XP bonus badge on last step */}
          {isLastStep && (
            <div className="mx-8 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-center">
              <span className="text-yellow-700 dark:text-yellow-400 font-black text-sm">
                🎁 {t('onboarding.xpBonus') || '+50 XP bonus when you start!'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="px-8 pb-6 flex gap-3">
            {!isLastStep && (
              <button
                onClick={() => completeOnboarding()}
                className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {t('onboarding.skip') || 'Skip'}
              </button>
            )}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              disabled={completing}
              className="flex-1 py-2.5 rounded-xl font-black text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isLastStep
                ? (completing ? '...' : t('onboarding.start') || "Let's Go! 🚀")
                : t('onboarding.next') || 'Next →'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
