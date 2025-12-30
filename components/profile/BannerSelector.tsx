'use client';

/**
 * BannerSelector - Component for selecting predefined profile banners
 *
 * Displays a grid of predefined banner options
 * Allows users to select or upload custom banners
 */

import React from 'react';
import { PREDEFINED_BANNERS, BannerOption } from '@/lib/constants/banners';
import Image from 'next/image';

interface BannerSelectorProps {
  currentBanner: string;
  onSelect: (url: string, type: 'predefined') => void;
  canUploadCustom: boolean;
  onUploadCustomClick: () => void;
}

export function BannerSelector({
  currentBanner,
  onSelect,
  canUploadCustom,
  onUploadCustomClick,
}: BannerSelectorProps) {
  const handleBannerClick = (banner: BannerOption) => {
    onSelect(banner.url, 'predefined');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Bannière de profil
      </label>

      {/* Predefined banners grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {PREDEFINED_BANNERS.map((banner) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => handleBannerClick(banner)}
            className={`
              relative overflow-hidden rounded-xl border-2 transition-all group
              ${
                currentBanner === banner.url
                  ? 'ring-2 ring-offset-2 ring-yellow-500 border-yellow-500'
                  : 'border-gray-300 hover:border-celo'
              }
            `}
            title={banner.description}
          >
            {/* Banner preview */}
            <div className="aspect-[4/1] relative bg-gray-200">
              <Image
                src={banner.url}
                alt={banner.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to gradient if image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.style.background =
                      'linear-gradient(135deg, #FCFF52 0%, #f59e0b 100%)';
                  }
                }}
              />
            </div>

            {/* Banner name overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <span className="text-white font-semibold text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 text-center">
                {banner.name}
              </span>
            </div>

            {/* Selected indicator */}
            {currentBanner === banner.url && (
              <div className="absolute top-2 right-2 bg-celo/50 rounded-full p-1 shadow-lg">
                <svg
                  className="w-4 h-4 text-gray-900"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom banner upload button */}
      <button
        type="button"
        onClick={onUploadCustomClick}
        disabled={!canUploadCustom}
        className={`
          w-full py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all
          ${
            canUploadCustom
              ? 'border-celo bg-celo/5 text-gray-900 hover:bg-celo/10'
              : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {canUploadCustom ? (
          <>
            📤 Télécharger une bannière personnalisée
          </>
        ) : (
          <>
            🔒 Bannière personnalisée débloquée après 100 jeux
          </>
        )}
      </button>

      <p className="text-gray-500 text-xs mt-2">
        Dimensions recommandées: 1200×300px (ratio 4:1)
      </p>
    </div>
  );
}
