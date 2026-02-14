'use client';

import { motion } from 'framer-motion';
import { useChainSelector } from '@/hooks/useChainSelector';
import { CHAIN_CONFIG } from '@/lib/contracts/addresses';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { MegaEthIcon } from './MegaEthIcon';

interface ChainWarningProps {
  className?: string;
}

export function ChainWarning({ className = '' }: ChainWarningProps) {
  const { isConnected, isSupportedChain: isSupported, currentChain, switchToCelo, switchToBase, switchToMegaeth } = useChainSelector();
  const { t } = useLanguage();

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
          <span>{CHAIN_CONFIG.celo.icon}</span>
          <span>{CHAIN_CONFIG.celo.shortName}</span>
        </button>
        <button
          onClick={switchToBase}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span>{CHAIN_CONFIG.base.icon}</span>
          <span>{CHAIN_CONFIG.base.shortName}</span>
        </button>
        <button
          onClick={switchToMegaeth}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-400 hover:bg-pink-500 text-gray-900 rounded-lg text-sm font-medium transition-colors"
        >
          <MegaEthIcon size={16} />
          <span>{CHAIN_CONFIG.megaeth.shortName}</span>
        </button>
      </div>
    </motion.div>
  );
}
