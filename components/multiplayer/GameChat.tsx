/**
 * GameChat Component
 * In-game chat panel with quick emotes for multiplayer games
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { ChatMessage } from '@/hooks/useGameChat';
import { QUICK_EMOTES, type EmoteId } from '@/hooks/useGameChat';

interface GameChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onSendEmote: (emoteId: EmoteId) => Promise<void>;
  myUserId: string | null;
  disabled?: boolean;
}

export function GameChat({
  messages,
  onSendMessage,
  onSendEmote,
  myUserId,
  disabled = false,
}: GameChatProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;

    await onSendMessage(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleEmote = async (emoteId: EmoteId) => {
    if (disabled) return;
    await onSendEmote(emoteId);
    setShowEmotes(false);
  };

  const getEmoteDisplay = (emoteId: string) => {
    const emote = QUICK_EMOTES.find(e => e.id === emoteId);
    return emote ? `${emote.emoji} ${emote.label}` : emoteId;
  };

  const unreadCount = !isExpanded ? messages.filter(m => m.userId !== myUserId).length : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat toggle button */}
      {!isExpanded && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsExpanded(true)}
          className="relative w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        >
          <span className="text-xl">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Expanded chat panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-72 sm:w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            style={{ maxHeight: '400px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <span className="font-bold text-sm">
                {t('chat.title') || 'Chat'}
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[120px] max-h-[240px]">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
                  {t('chat.empty') || 'No messages yet'}
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-xs ${
                      msg.userId === myUserId ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span className="text-gray-400 dark:text-gray-500 mr-1">
                      {msg.userId === myUserId ? '' : `${msg.displayName}: `}
                    </span>
                    {msg.type === 'emote' ? (
                      <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full px-2 py-0.5 font-medium">
                        {getEmoteDisplay(msg.content)}
                      </span>
                    ) : (
                      <span className={`inline-block rounded-lg px-2 py-1 ${
                        msg.userId === myUserId
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        {msg.content}
                      </span>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick emotes */}
            <AnimatePresence>
              {showEmotes && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="grid grid-cols-4 gap-1 p-2">
                    {QUICK_EMOTES.map((emote) => (
                      <button
                        key={emote.id}
                        onClick={() => handleEmote(emote.id as EmoteId)}
                        disabled={disabled}
                        className="flex flex-col items-center py-1 px-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-xs"
                      >
                        <span className="text-lg">{emote.emoji}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-[10px]">{emote.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-2 flex gap-1">
              <button
                type="button"
                onClick={() => setShowEmotes(!showEmotes)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors text-sm flex-shrink-0"
              >
                😊
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('chat.placeholder') || 'Type a message...'}
                disabled={disabled}
                maxLength={200}
                className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={disabled || !inputValue.trim()}
                className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0 text-sm"
              >
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GameChat;
