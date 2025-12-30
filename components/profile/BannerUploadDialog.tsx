'use client';

/**
 * BannerUploadDialog - Dialog for uploading custom profile banners
 *
 * Allows users to upload custom banner images
 * Validates file size and dimensions
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface BannerUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (bannerUrl: string) => void;
}

export function BannerUploadDialog({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: BannerUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      setError('Fichier ou utilisateur manquant');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/user/banner/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Échec du téléchargement');
      }

      const data = await response.json();
      onSuccess(data.bannerUrl);
      handleClose();
    } catch (err: unknown) {
      console.error('Banner upload error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Télécharger une bannière personnalisée
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Personnalisez votre profil avec une bannière unique
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-4 bg-red-100 border-2 border-red-400 rounded-xl p-3">
                    <p className="text-red-800 text-sm">⚠️ {error}</p>
                  </div>
                )}

                {/* Preview */}
                {preview && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">Aperçu:</p>
                    <div className="relative w-full aspect-[4/1] rounded-xl overflow-hidden border-2 border-gray-300">
                      <Image
                        src={preview}
                        alt="Banner preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* File input */}
                <div className="mb-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-celo hover:bg-celo/5 transition-all text-center"
                  >
                    <div className="text-4xl mb-2">📤</div>
                    <p className="font-semibold text-gray-900 mb-1">
                      {file ? file.name : 'Cliquez pour sélectionner une image'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG ou WebP • Max 5MB • 1200×300px recommandé
                    </p>
                  </button>
                </div>

                {/* Recommendations */}
                <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 text-sm mb-2">
                    📐 Conseils pour une belle bannière
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Dimensions recommandées: 1200×300px (ratio 4:1)</li>
                    <li>• Formats acceptés: JPG, PNG, WebP</li>
                    <li>• Taille maximale: 5MB</li>
                    <li>• Évitez le texte trop petit (illisible sur mobile)</li>
                    <li>• Préférez des images haute résolution</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="flex-1 bg-gradient-to-r from-celo to-celo hover:brightness-110 disabled:from-gray-300 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
                  >
                    {uploading ? 'Téléchargement...' : 'Télécharger'}
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={uploading}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
