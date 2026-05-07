'use client';
import { useState, useEffect, useCallback } from 'react';

/* ── Types ── */
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type ThemeFilter = 'none' | 'sepia' | 'blueLight';

export interface UseAccessibilityOptions {
  /** localStorage key prefix — change per project to avoid collisions. Default: 'wk_a11y_' */
  storagePrefix?: string;
}

export interface UseAccessibilityReturn {
  /* ── State ── */
  fontSize: number;
  highContrast: boolean;
  calmMode: boolean;
  focusMode: boolean;
  magnifier: boolean;
  lineSpacing: number;
  letterSpacing: number;
  wordSpacing: number;
  colorBlindMode: ColorBlindMode;
  dyslexiaFont: boolean;
  readingGuide: boolean;
  readingGuideY: number;
  themeFilter: ThemeFilter;
  ttsSpeed: number;
  showShortcuts: boolean;
  glossaryEnabled: boolean;
  a11yOpen: boolean;

  /* ── Actions ── */
  setA11yOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowShortcuts: (v: boolean | ((prev: boolean) => boolean)) => void;
  changeFontSize: (delta: number) => void;
  setFontSizeAbsolute: (size: number) => void;
  toggleContrast: () => void;
  toggleCalm: () => void;
  toggleFocus: () => void;
  toggleMagnifier: () => void;
  cycleLineSpacing: () => void;
  cycleLetterSpacing: () => void;
  cycleWordSpacing: () => void;
  cycleColorBlind: () => void;
  toggleDyslexiaFont: () => void;
  toggleReadingGuide: () => void;
  cycleThemeFilter: () => void;
  cycleTtsSpeed: () => void;
  toggleGlossary: () => void;
  resetA11y: () => void;

  /* ── Helpers ── */
  /** Spread onto your root container's `style` to apply a11y visual settings */
  containerStyle: React.CSSProperties;
  /** Data attributes to spread onto the root container for glossary + lang */
  containerDataAttrs: (lang: 'tr' | 'en') => Record<string, string>;
}

/* ═══════════════════════════════════════════════════════════════ */
/* useAccessibility — standalone custom hook                      */
/* ═══════════════════════════════════════════════════════════════ */
export function useAccessibility(opts?: UseAccessibilityOptions): UseAccessibilityReturn {
  const p = opts?.storagePrefix ?? 'wk_a11y_';

  /* ── State ── */
  const [fontSize, setFontSize]           = useState(13);
  const [highContrast, setHighContrast]   = useState(false);
  const [calmMode, setCalmMode]           = useState(false);
  const [focusMode, setFocusMode]         = useState(false);
  const [magnifier, setMagnifier]         = useState(false);
  const [lineSpacing, setLineSpacing]     = useState(1.85);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [wordSpacing, setWordSpacing]     = useState(0);
  const [colorBlindMode, setColorBlindMode] = useState<ColorBlindMode>('none');
  const [dyslexiaFont, setDyslexiaFont]   = useState(false);
  const [readingGuide, setReadingGuide]   = useState(false);
  const [readingGuideY, setReadingGuideY] = useState(0);
  const [themeFilter, setThemeFilter]     = useState<ThemeFilter>('none');
  const [ttsSpeed, setTtsSpeed]           = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [glossaryEnabled, setGlossaryEnabled] = useState(false);
  const [a11yOpen, setA11yOpen]           = useState(false);

  /* ── Restore from localStorage ── */
  useEffect(() => {
    try {
      const fs = localStorage.getItem(`${p}fontSize`);
      if (fs) setFontSize(Number(fs));
      if (localStorage.getItem(`${p}highContrast`) === 'true') setHighContrast(true);
      if (localStorage.getItem(`${p}calmMode`) === 'true') setCalmMode(true);
      if (localStorage.getItem(`${p}focusMode`) === 'true') setFocusMode(true);
      if (localStorage.getItem(`${p}magnifier`) === 'true') setMagnifier(true);
      const ls = localStorage.getItem(`${p}lineSpacing`);
      if (ls) setLineSpacing(Number(ls));
      const les = localStorage.getItem(`${p}letterSpacing`);
      if (les) setLetterSpacing(Number(les));
      const ws = localStorage.getItem(`${p}wordSpacing`);
      if (ws) setWordSpacing(Number(ws));
      const cb = localStorage.getItem(`${p}colorBlind`);
      if (cb && cb !== 'none') setColorBlindMode(cb as ColorBlindMode);
      if (localStorage.getItem(`${p}dyslexiaFont`) === 'true') setDyslexiaFont(true);
      if (localStorage.getItem(`${p}readingGuide`) === 'true') setReadingGuide(true);
      const tf = localStorage.getItem(`${p}themeFilter`);
      if (tf && tf !== 'none') setThemeFilter(tf as ThemeFilter);
      const ts = localStorage.getItem(`${p}ttsSpeed`);
      if (ts) setTtsSpeed(Number(ts));
      if (localStorage.getItem(`${p}glossary`) === 'true') setGlossaryEnabled(true);
    } catch { /* SSR or private browsing */ }
  }, [p]);

  /* ── Reading Guide mouse tracking ── */
  useEffect(() => {
    if (!readingGuide) return;
    const handler = (e: MouseEvent) => setReadingGuideY(e.clientY);
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [readingGuide]);

  /* ── Actions ── */
  const changeFontSize = useCallback((delta: number) => {
    setFontSize(prev => {
      const next = Math.max(10, Math.min(30, prev + delta));
      localStorage.setItem(`${p}fontSize`, String(next));
      return next;
    });
  }, [p]);

  const setFontSizeAbsolute = useCallback((size: number) => {
    const next = Math.max(10, Math.min(30, size));
    setFontSize(next);
    localStorage.setItem(`${p}fontSize`, String(next));
  }, [p]);

  const toggleContrast = useCallback(() => {
    setHighContrast(v => { localStorage.setItem(`${p}highContrast`, String(!v)); return !v; });
  }, [p]);

  const toggleCalm = useCallback(() => {
    setCalmMode(v => { localStorage.setItem(`${p}calmMode`, String(!v)); return !v; });
  }, [p]);

  const toggleFocus = useCallback(() => {
    setFocusMode(v => { localStorage.setItem(`${p}focusMode`, String(!v)); return !v; });
  }, [p]);

  const toggleMagnifier = useCallback(() => {
    setMagnifier(v => { localStorage.setItem(`${p}magnifier`, String(!v)); return !v; });
  }, [p]);

  const cycleLineSpacing = useCallback(() => {
    const vals = [1.5, 1.85, 2, 2.5];
    setLineSpacing(prev => {
      const next = vals[(vals.indexOf(prev) + 1) % vals.length];
      localStorage.setItem(`${p}lineSpacing`, String(next));
      return next;
    });
  }, [p]);

  const cycleLetterSpacing = useCallback(() => {
    const vals = [0, 1, 2, 3];
    setLetterSpacing(prev => {
      const next = vals[(vals.indexOf(prev) + 1) % vals.length];
      localStorage.setItem(`${p}letterSpacing`, String(next));
      return next;
    });
  }, [p]);

  const cycleWordSpacing = useCallback(() => {
    const vals = [0, 2, 4, 6];
    setWordSpacing(prev => {
      const next = vals[(vals.indexOf(prev) + 1) % vals.length];
      localStorage.setItem(`${p}wordSpacing`, String(next));
      return next;
    });
  }, [p]);

  const cycleColorBlind = useCallback(() => {
    const vals: ColorBlindMode[] = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
    setColorBlindMode(prev => {
      const next = vals[(vals.indexOf(prev) + 1) % vals.length];
      localStorage.setItem(`${p}colorBlind`, next);
      return next;
    });
  }, [p]);

  const toggleDyslexiaFont = useCallback(() => {
    setDyslexiaFont(v => { localStorage.setItem(`${p}dyslexiaFont`, String(!v)); return !v; });
  }, [p]);

  const toggleReadingGuide = useCallback(() => {
    setReadingGuide(v => { localStorage.setItem(`${p}readingGuide`, String(!v)); return !v; });
  }, [p]);

  const cycleThemeFilter = useCallback(() => {
    const vals: ThemeFilter[] = ['none', 'sepia', 'blueLight'];
    setThemeFilter(prev => {
      const next = vals[(vals.indexOf(prev) + 1) % vals.length];
      localStorage.setItem(`${p}themeFilter`, next);
      return next;
    });
  }, [p]);

  const cycleTtsSpeed = useCallback(() => {
    const vals = [0.5, 0.75, 1, 1.25, 1.5, 2];
    setTtsSpeed(prev => {
      const next = vals[(vals.indexOf(prev) + 1) % vals.length];
      localStorage.setItem(`${p}ttsSpeed`, String(next));
      return next;
    });
  }, [p]);

  const toggleGlossary = useCallback(() => {
    setGlossaryEnabled(v => { localStorage.setItem(`${p}glossary`, String(!v)); return !v; });
  }, [p]);

  const resetA11y = useCallback(() => {
    setFontSize(13); setHighContrast(false); setCalmMode(false); setFocusMode(false); setMagnifier(false);
    setLineSpacing(1.85); setLetterSpacing(0); setWordSpacing(0); setColorBlindMode('none');
    setDyslexiaFont(false); setReadingGuide(false); setThemeFilter('none'); setTtsSpeed(1);
    setGlossaryEnabled(false);
    [
      `${p}fontSize`, `${p}highContrast`, `${p}calmMode`, `${p}focusMode`, `${p}magnifier`,
      `${p}lineSpacing`, `${p}letterSpacing`, `${p}wordSpacing`, `${p}colorBlind`,
      `${p}dyslexiaFont`, `${p}readingGuide`, `${p}themeFilter`, `${p}ttsSpeed`, `${p}glossary`,
    ].forEach(k => localStorage.removeItem(k));
  }, [p]);

  /* ── Keyboard shortcuts (a11y-specific) ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !isTyping) {
        e.preventDefault(); setShowShortcuts(v => !v);
      }
      if (e.key === 'Escape') { setShowShortcuts(false); setA11yOpen(false); }
      if (e.altKey && e.key.toLowerCase() === 'a') { e.preventDefault(); setA11yOpen(v => !v); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ── containerStyle helper ── */
  const containerStyle: React.CSSProperties = (() => {
    // Build combined CSS filter string (prevents overwriting)
    const filters: string[] = [];
    if (highContrast)                   filters.push('contrast(1.4)');
    if (colorBlindMode !== 'none')      filters.push(`url(#${colorBlindMode}-filter)`);
    if (themeFilter === 'sepia')        filters.push('sepia(0.3) saturate(1.1)');
    if (themeFilter === 'blueLight')    filters.push('brightness(0.95)');

    return {
      fontSize:      `${fontSize}px`,
      lineHeight:    lineSpacing,
      letterSpacing: `${letterSpacing}px`,
      wordSpacing:   `${wordSpacing}px`,
      fontFamily:    dyslexiaFont ? "'OpenDyslexic', 'open-dyslexic', sans-serif" : undefined,
      filter:        filters.length > 0 ? filters.join(' ') : undefined,
    };
  })();


  const containerDataAttrs = useCallback((lang: 'tr' | 'en') => ({
    'data-glossary': glossaryEnabled ? 'true' : 'false',
    'data-lang': lang,
  }), [glossaryEnabled]);

  return {
    fontSize, highContrast, calmMode, focusMode, magnifier,
    lineSpacing, letterSpacing, wordSpacing, colorBlindMode,
    dyslexiaFont, readingGuide, readingGuideY, themeFilter,
    ttsSpeed, showShortcuts, glossaryEnabled, a11yOpen,
    setA11yOpen, setShowShortcuts,
    changeFontSize, setFontSizeAbsolute, toggleContrast, toggleCalm, toggleFocus, toggleMagnifier,
    cycleLineSpacing, cycleLetterSpacing, cycleWordSpacing, cycleColorBlind,
    toggleDyslexiaFont, toggleReadingGuide, cycleThemeFilter, cycleTtsSpeed,
    toggleGlossary, resetA11y,
    containerStyle, containerDataAttrs,
  };
}
