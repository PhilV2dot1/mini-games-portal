'use client';

import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-8 border-t-2 border-gray-300 pt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left side - Celo info */}
        <div className="text-center sm:text-left text-gray-600 text-xs">
          <p>{t('home.footerBuilt')}</p>
          <p className="mt-1">
            <a
              href="https://celo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-yellow-600 font-semibold transition-colors underline"
            >
              {t('home.footerLearnCelo')}
            </a>
          </p>
        </div>

        {/* Right side - Author attribution */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl px-4 py-3 border-2 border-gray-300 shadow-md hover:shadow-lg transition-all">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 shadow-sm bg-white">
            <Image
              src="/avatars/author/philv2dot1.png"
              alt="Philv2dot1"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 font-medium">{t('home.footerCreatedBy')}</p>
            <p className="text-sm font-bold text-gray-900">Philv2dot1</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
