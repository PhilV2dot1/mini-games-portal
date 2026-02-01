/**
 * useGameChat Hook
 * In-game chat and emotes for multiplayer games.
 * Uses the existing multiplayer action system (action_type: 'chat').
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  userId: string;
  playerNumber: number;
  displayName: string;
  type: 'text' | 'emote';
  content: string;
  timestamp: number;
}

// Quick emotes for in-game use
export const QUICK_EMOTES = [
  { id: 'gg', label: 'GG', emoji: '🎮' },
  { id: 'gl', label: 'Good Luck', emoji: '🍀' },
  { id: 'nice', label: 'Nice!', emoji: '👏' },
  { id: 'wow', label: 'Wow', emoji: '😮' },
  { id: 'think', label: 'Thinking...', emoji: '🤔' },
  { id: 'hurry', label: 'Hurry!', emoji: '⏰' },
  { id: 'wave', label: 'Hi!', emoji: '👋' },
  { id: 'laugh', label: 'Haha', emoji: '😂' },
] as const;

export type EmoteId = typeof QUICK_EMOTES[number]['id'];

interface UseGameChatOptions {
  sendAction: (type: 'chat', data: Record<string, unknown>) => Promise<void>;
  myUserId: string | null;
  myPlayerNumber: number | null;
  myDisplayName: string;
}

interface UseGameChatReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  sendEmote: (emoteId: EmoteId) => Promise<void>;
  handleIncomingAction: (action: { user_id: string | null; action_type: string; action_data: Record<string, unknown> }) => void;
  clearMessages: () => void;
}

const MAX_MESSAGES = 100;

export function useGameChat({
  sendAction,
  myUserId,
  myPlayerNumber,
  myDisplayName,
}: UseGameChatOptions): UseGameChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messageIdCounter = useRef(0);

  // Clear on unmount
  useEffect(() => {
    return () => {
      setMessages([]);
    };
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev.slice(-(MAX_MESSAGES - 1)), msg]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !myUserId || myPlayerNumber === null) return;

    const trimmed = text.trim().slice(0, 200); // Limit message length

    const msg: ChatMessage = {
      id: `local-${++messageIdCounter.current}`,
      userId: myUserId,
      playerNumber: myPlayerNumber,
      displayName: myDisplayName,
      type: 'text',
      content: trimmed,
      timestamp: Date.now(),
    };

    addMessage(msg);

    await sendAction('chat', {
      type: 'text',
      content: trimmed,
      playerNumber: myPlayerNumber,
      displayName: myDisplayName,
    });
  }, [myUserId, myPlayerNumber, myDisplayName, sendAction, addMessage]);

  const sendEmote = useCallback(async (emoteId: EmoteId) => {
    if (!myUserId || myPlayerNumber === null) return;

    const emote = QUICK_EMOTES.find(e => e.id === emoteId);
    if (!emote) return;

    const msg: ChatMessage = {
      id: `local-${++messageIdCounter.current}`,
      userId: myUserId,
      playerNumber: myPlayerNumber,
      displayName: myDisplayName,
      type: 'emote',
      content: emoteId,
      timestamp: Date.now(),
    };

    addMessage(msg);

    await sendAction('chat', {
      type: 'emote',
      content: emoteId,
      playerNumber: myPlayerNumber,
      displayName: myDisplayName,
    });
  }, [myUserId, myPlayerNumber, myDisplayName, sendAction, addMessage]);

  const handleIncomingAction = useCallback((action: {
    user_id: string | null;
    action_type: string;
    action_data: Record<string, unknown>;
  }) => {
    if (action.action_type !== 'chat') return;
    // Don't duplicate our own messages
    if (action.user_id === myUserId) return;

    const data = action.action_data;
    const msg: ChatMessage = {
      id: `remote-${++messageIdCounter.current}`,
      userId: (action.user_id as string) || 'unknown',
      playerNumber: (data.playerNumber as number) || 0,
      displayName: (data.displayName as string) || 'Player',
      type: (data.type as 'text' | 'emote') || 'text',
      content: (data.content as string) || '',
      timestamp: Date.now(),
    };

    addMessage(msg);
  }, [myUserId, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    sendEmote,
    handleIncomingAction,
    clearMessages,
  };
}

export default useGameChat;
