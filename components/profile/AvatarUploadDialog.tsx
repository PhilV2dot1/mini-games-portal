'use client';

/**
 * AvatarUploadDialog - Modal for uploading custom avatars
 *
 * Allows users with avatar_unlocked=true to upload custom avatar images.
 * Validates file type and size before upload.
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface AvatarUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (avatarUrl: string) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function AvatarUploadDialog({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: AvatarUploadDialogProps) {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess(false);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('errors.invalidFileType'));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t('errors.fileTooLarge'));
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t('avatar.pleaseSelectFile'));
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      formData.append('userId', userId);

      const response = await fetch('/api/user/avatar/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('errors.savingFailed'));
      }

      const data = await response.json();
      setSuccess(true);

      setTimeout(() => {
        onSuccess(data.avatarUrl);
        handleClose();
      }, 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || t('errors.generic'));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    setSuccess(false);
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

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-gray-700 max-w-md w-full"
              style={{ boxShadow: '0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  📤 {t('avatar.uploadCustomAvatar')}
                </h2>
                <p className="text-gray-600 text-sm">
                  {t('avatar.fileTypes')}
                </p>
              </div>

              {/* Success message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-100 border-2 border-green-400 rounded-xl p-4 mb-4"
                >
                  <p className="text-green-800 font-semibold text-center">
                    ✅ {t('avatar.uploadSuccess')}
                  </p>
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-100 border-2 border-red-400 rounded-xl p-3 mb-4"
                >
                  <p className="text-red-800 text-sm">⚠️ {error}</p>
                </motion.div>
              )}

              {/* File input */}
              <div className="space-y-4">
                {/* Preview */}
                {previewUrl && (
                  <div className="flex justify-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-celo shadow-lg">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl transition-all disabled:cursor-not-allowed"
                  >
                    {selectedFile ? `📎 ${t('avatar.changeFile')}` : `📁 ${t('avatar.selectFile')}`}
                  </button>
                </div>

                {/* File info */}
                {selectedFile && (
                  <div className="text-sm text-gray-600 text-center">
                    <p className="font-semibold">{selectedFile.name}</p>
                    <p className="text-xs">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="flex-1 bg-gradient-to-r from-celo to-celo hover:brightness-110 disabled:from-gray-300 disabled:to-gray-400 text-gray-900 font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
                  >
                    {uploading ? t('avatar.uploading') : `📤 ${t('avatar.upload')}`}
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={uploading}
                    className="px-6 py-3 bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 disabled:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
                  >
                    {t('cancel')}
                  </button>
                </div>

                {/* Info */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl p-3 text-xs text-gray-700">
                  <p className="font-semibold mb-1 text-gray-900">💡 {t('avatar.tips')}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t('avatar.tipSquare')}</li>
                    <li>{t('avatar.tipSimple')}</li>
                    <li>{t('avatar.tipFormat')}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
