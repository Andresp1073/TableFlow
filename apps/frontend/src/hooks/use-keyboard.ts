'use client';

import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

export function useKeyboard(key: string, handler: KeyHandler, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: KeyboardEvent) => {
      if (event.key === key || event.code === key) {
        handler(event);
      }
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [key, handler, enabled]);
}

export function useKeyboardShortcut(
  shortcut: { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean },
  handler: KeyHandler,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: KeyboardEvent) => {
      const { key, ctrl, meta, shift } = shortcut;
      const ctrlOrMeta = ctrl || meta;

      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (ctrlOrMeta && !event.ctrlKey && !event.metaKey) return;
      if (shift && !event.shiftKey) return;
      if (!ctrlOrMeta && (event.ctrlKey || event.metaKey)) return;

      event.preventDefault();
      handler(event);
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [shortcut, handler, enabled]);
}
