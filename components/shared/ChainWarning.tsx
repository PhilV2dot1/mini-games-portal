'use client';

import { motion } from 'framer-motion';
import { useChainSelector } from '@/hooks/useChainSelector';
import { CHAIN_CONFIG } from '@/lib/contracts/addresses';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CeloIcon } from './CeloIcon';
import { BaseIcon } from './BaseIcon';
import { MegaEthIcon } from './MegaEthIcon';
import { SoneiumIcon } from './SoneiumIcon';

interface ChainWarningProps {
  className?: string;
}

export function ChainWarning({ className = '' }: ChainWarningProps) {
  const { isConnected, isSupportedChain: isSupported, isOnSoneium, currentChain, switchToCelo, switchToBase, switchToMegaeth, switchToSoneium } = useChainSelector();
  const { t } = useLanguage();

  // Show Soneium development info banner
  if (isOnSoneium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl p-3 ${className}`}
      >
        <div className="flex items-center gap-2">
          <SoneiumIcon size={16} />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {t('chain.onchainDev')}
          </p>
        </div>
      </motion.div>
    );
  }

  if (!isConnected || isSupported) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 rounded-xl p-4 ${className}`}
    >
      <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
        {t('chain.unsupported')}
      </p>
      <p className="text-xs text-orange-600 dark:text-orange-300 mb-3">
        {currentChain?.name || 'Unknown'} {t('chain.switchToPlay')}
      </p>
      <div className="flex gap-2">
        <button
          onClick={switchToCelo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg text-sm font-medium transition-colors"
        >
          <CeloIcon size={16} />
          <span>{CHAIN_CONFIG.celo.shortName}</span>
        </button>
        <button
          onClick={switchToBase}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <BaseIcon size={16} />
          <span>{CHAIN_CONFIG.base.shortName}</span>
        </button>
        <button
          onClick={switchToMegaeth}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-400 hover:bg-pink-500 text-gray-900 rounded-lg text-sm font-medium transition-colors"
        >
          <MegaEthIcon size={16} />
          <span>{CHAIN_CONFIG.megaeth.shortName}</span>
        </button>
        <button
          onClick={switchToSoneium}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <SoneiumIcon size={16} />
          <span>{CHAIN_CONFIG.soneium.shortName}</span>
        </button>
      </div>
    </motion.div>
  );
}
