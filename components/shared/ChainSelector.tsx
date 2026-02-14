'use client';

import { useChainSelector } from '@/hooks/useChainSelector';
import { CHAIN_CONFIG } from '@/lib/contracts/addresses';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CeloIcon } from './CeloIcon';
import { BaseIcon } from './BaseIcon';
import { MegaEthIcon } from './MegaEthIcon';

interface ChainSelectorProps {
  className?: string;
}

export function ChainSelector({ className = '' }: ChainSelectorProps) {
  const { isOnCelo, isOnBase, isOnMegaeth, switchToCelo, switchToBase, switchToMegaeth } = useChainSelector();
  const { t } = useLanguage();

  return (
    <div className={`flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      <button
        onClick={switchToCelo}
        className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-all ${
          isOnCelo
            ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        title={t('chain.switchTo') + ' Celo'}
      >
        <CeloIcon size={16} />
        <span>{CHAIN_CONFIG.celo.shortName}</span>
      </button>
      <button
        onClick={switchToBase}
        className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-all ${
          isOnBase
            ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        title={t('chain.switchTo') + ' Base'}
      >
        <BaseIcon size={16} />
        <span>{CHAIN_CONFIG.base.shortName}</span>
      </button>
      <button
        onClick={switchToMegaeth}
        className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-all ${
          isOnMegaeth
            ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        title={t('chain.switchTo') + ' MegaETH'}
      >
        <MegaEthIcon size={16} />
        <span>{CHAIN_CONFIG.megaeth.shortName}</span>
      </button>
    </div>
  );
}
