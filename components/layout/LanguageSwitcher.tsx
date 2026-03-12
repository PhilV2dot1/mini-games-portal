'use client';

/**
 * Language Switcher Component
 * Toggle between English (EN), French (FR), Spanish (ES), Portuguese (PT)
 */

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { motion } from 'framer-motion';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
] as const;

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-xl p-1">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`relative px-2.5 py-1 rounded-lg text-sm font-bold transition-all ${
            language === code
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {language === code && (
            <motion.div
              layoutId="activeLanguage"
              className="absolute inset-0 rounded-lg"
              style={{ backgroundColor: '#4B5563' }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{label}</span>
        </button>
      ))}
    </div>
  );
}
