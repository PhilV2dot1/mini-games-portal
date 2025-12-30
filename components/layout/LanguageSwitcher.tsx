'use client';

/**
 * Language Switcher Component
 * Toggle between English (EN) and French (FR)
 */

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { motion } from 'framer-motion';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-xl p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`relative px-3 py-1 rounded-lg text-sm font-bold transition-all ${
          language === 'en'
            ? 'text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {language === 'en' && (
          <motion.div
            layoutId="activeLanguage"
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: '#4B5563' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10" style={{ color: language === 'en' ? 'white' : undefined }}>EN</span>
      </button>

      <button
        onClick={() => setLanguage('fr')}
        className={`relative px-3 py-1 rounded-lg text-sm font-bold transition-all ${
          language === 'fr'
            ? 'text-white'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {language === 'fr' && (
          <motion.div
            layoutId="activeLanguage"
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: '#4B5563' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">FR</span>
      </button>
    </div>
  );
}
