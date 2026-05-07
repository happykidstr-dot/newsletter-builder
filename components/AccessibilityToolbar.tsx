'use client';
import React, { useState, useEffect, useRef } from 'react';
import type { UseAccessibilityReturn } from '@/hooks/useAccessibility';
// TTS/STT types defined inline (no external hook dependency)
export interface UseTTSReturn {
  isSupported: boolean; isSpeaking: boolean; isPaused: boolean;
  speak: (text: string, lang: string) => void; pause: () => void;
  resume: () => void; stop: () => void; setRate: (r: number) => void;
}
export interface UseSTTReturn {
  isSupported: boolean; isListening: boolean; transcript: string;
  interimTranscript: string; error: string | null;
  startListening: (lang: string) => void; stopListening: () => void;
  resetTranscript: () => void;
}

/* ── Types ── */
export interface ShortcutDef {
  key: string;
  desc_tr: string;
  desc_en: string;
}

export interface AccessibilityToolbarProps extends UseAccessibilityReturn {
  lang: 'tr' | 'en';
  /** Extra keyboard-shortcut rows to show in the shortcuts modal */
  extraShortcuts?: ShortcutDef[];
  /** Text-to-Speech controls (optional — gracefully omitted if not provided) */
  tts?: UseTTSReturn;
  /** Speech-to-Text controls (optional — gracefully omitted if not provided) */
  stt?: UseSTTReturn;
}

/* ═══════════════════════════════════════════════════════════════
   AccessibilityToolbar — standalone reusable component
   ═══════════════════════════════════════════════════════════════ */
export function AccessibilityToolbar({
  lang,
  extraShortcuts,
  tts,
  stt,
  /* state */
  fontSize, highContrast, calmMode, focusMode, magnifier,
  lineSpacing, letterSpacing, wordSpacing, colorBlindMode,
  dyslexiaFont, readingGuide, readingGuideY, themeFilter,
  ttsSpeed, showShortcuts, glossaryEnabled, a11yOpen,
  /* actions */
  setA11yOpen, setShowShortcuts,
  changeFontSize, setFontSizeAbsolute, toggleContrast, toggleCalm, toggleFocus, toggleMagnifier,
  cycleLineSpacing, cycleLetterSpacing, cycleWordSpacing, cycleColorBlind,
  toggleDyslexiaFont, toggleReadingGuide, cycleThemeFilter, cycleTtsSpeed,
  toggleGlossary, resetA11y,
}: AccessibilityToolbarProps) {
  const t = (tr: string, en: string) => lang === 'tr' ? tr : en;

  /* ── Dynamic CSS (calm, focus, magnifier modes) ── */
  const dynamicCSS = `
    ${calmMode ? `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      [style*="gradient"] { background: rgba(99,102,241,0.3) !important; }
    ` : ''}
    ${focusMode ? `
      [data-main-scroll] > div > div:not(:hover):not(:focus-within) > div:not([id^="section-"]) {
        opacity: 0.3;
        transition: opacity 0.3s;
      }
      [data-main-scroll] > div > div:hover,
      [data-main-scroll] > div > div:focus-within {
        opacity: 1 !important;
      }
      [data-main-scroll] [id^="section-"]:not(:hover) {
        opacity: 0.4;
      }
      [data-main-scroll] [id^="section-"]:hover {
        opacity: 1 !important;
      }
    ` : ''}
  `;

/* ── Cursor-Following Magnifier Lens ── */
function MagnifierLens() {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [text, setText] = useState('');
  const lensRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });

        // Temporarily hide lens so elementFromPoint returns real elements
        const lens = lensRef.current;
        if (lens) lens.style.visibility = 'hidden';
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (lens) lens.style.visibility = '';

        if (!el) { setText(''); return; }

        // Skip toolbar, nav, buttons
        if (el.closest('.wk-a11y-fab, nav, header, .navbar, button, a')) {
          setText('');
          return;
        }

        // Walk up DOM to find nearest element with meaningful text
        let node: HTMLElement | null = el;
        let found = '';
        while (node && node !== document.body) {
          const txt = (node.innerText || '').trim().replace(/\s+/g, ' ');
          if (txt.length > 3 && txt.length < 600) {
            found = txt;
            break;
          }
          node = node.parentElement;
        }
        setText(found);
      });
    };

    window.addEventListener('mousemove', handle);
    return () => {
      window.removeEventListener('mousemove', handle);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const LENS_W = 320;
  const LENS_H = 140;
  const GAP = 24;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  let lx = pos.x + GAP;
  let ly = pos.y - LENS_H / 2;
  if (lx + LENS_W > vw - 8) lx = pos.x - LENS_W - GAP;
  if (ly < 8) ly = 8;
  if (ly + LENS_H > vh - 8) ly = vh - LENS_H - 8;

  return (
    <div
      ref={lensRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: lx,
        top: ly,
        width: LENS_W,
        maxHeight: LENS_H,
        zIndex: 99996,
        pointerEvents: 'none',
        opacity: text ? 1 : 0,
        transform: text ? 'scale(1)' : 'scale(0.96)',
        transition: 'opacity 0.12s ease, transform 0.12s ease',
        background: 'rgba(10, 10, 25, 0.96)',
        border: '2px solid rgba(139,92,246,0.65)',
        borderRadius: 14,
        padding: '10px 14px 14px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(139,92,246,0.12), 0 0 24px rgba(139,92,246,0.08)',
        backdropFilter: 'blur(14px)',
        overflow: 'hidden',
      }}
    >
      {/* Badge */}
      <div style={{
        fontSize: 9, fontWeight: 900, color: '#a78bfa',
        letterSpacing: 1.5, marginBottom: 9,
        display: 'flex', alignItems: 'center', gap: 5,
        textTransform: 'uppercase',
      }}>
        <span style={{ fontSize: 13 }}>🔍</span>
        Magnifier — 1.6×
      </div>

      {/* Magnified text */}
      <div style={{
        fontSize: 21,
        lineHeight: 1.5,
        color: 'rgba(255,255,255,0.92)',
        fontWeight: 450,
        letterSpacing: 0.3,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical' as const,
        wordBreak: 'break-word',
      }}>
        {text}
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)',
      }} />
    </div>
  );
}

  /* ── Shortcut definitions ── */
  const builtInShortcuts: ShortcutDef[] = [
    { key: '?', desc_tr: 'Bu paneli aç/kapat', desc_en: 'Toggle this panel' },
    { key: 'Esc', desc_tr: 'Panelleri kapat', desc_en: 'Close panels' },
    { key: 'Alt+A', desc_tr: '♿ Toolbar aç/kapat', desc_en: 'Toggle ♿ toolbar' },
  ];
  const allShortcuts = [...builtInShortcuts, ...(extraShortcuts ?? [])];

  /* ── Helper: toggle button style ── */
  const btnStyle = (active: boolean, color: string = 'rgba(245,158,11'): React.CSSProperties => ({
    width: '100%', padding: '7px 10px', borderRadius: 7,
    background: active ? `${color},0.15)` : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? `${color},0.4)` : 'rgba(255,255,255,0.12)'}`,
    color: active ? `${color},1)` : 'rgba(255,255,255,0.6)',
    fontWeight: 700, fontSize: 10, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
  });

  const cycBtnStyle = (active: boolean, color: string = 'rgba(6,182,212'): React.CSSProperties => ({
    ...btnStyle(active, color),
    justifyContent: 'space-between',
  });

  /* ── TTS helper ── */
  const handleReadSelection = () => {
    if (!tts) return;
    const sel = window.getSelection()?.toString().trim();
    if (sel) {
      tts.setRate(ttsSpeed);
      tts.speak(sel, lang);
    }
  };

  /* ── STT: paste transcript into focused input ── */
  const handlePasteTranscript = () => {
    if (!stt?.transcript) return;
    const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    if (el && ('value' in el)) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const before = el.value.substring(0, start);
      const after = el.value.substring(end);
      // Use native input setter to trigger React onChange
      const nativeSet = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      if (nativeSet) {
        nativeSet.call(el, before + stt.transcript + ' ' + after);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        el.value = before + stt.transcript + ' ' + after;
      }
      stt.resetTranscript();
    }
  };

  return (
    <>
      {/* Dynamic CSS injection */}
      <style>{dynamicCSS}</style>

      {/* ── Cursor-following Magnifier Lens ── */}
      {magnifier && <MagnifierLens />}

      {/* ── Skip to content ── */}
      <a href="#main-content" className="a11y-skip-link">
        {t('Ana içeriğe geç', 'Skip to main content')}
      </a>

      {/* ── Floating Accessibility Toolbar (FAB) ── */}
      <div className="wk-a11y-fab" style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 9998 }}>
        {/* Toggle button */}
        <button
          onClick={() => setA11yOpen((v: boolean) => !v)}
          aria-label={t('Erişilebilirlik ayarlarını aç/kapat', 'Toggle accessibility settings')}
          aria-expanded={a11yOpen}
          style={{ width: 44, height: 44, borderRadius: '50%', background: a11yOpen ? '#f59e0b' : 'rgba(99,102,241,0.9)', border: 'none', color: a11yOpen ? '#000' : '#fff', fontSize: 20, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
        >
          ♿
        </button>

        {/* Panel */}
        {a11yOpen && (
          <div
            role="dialog"
            aria-label={t('Erişilebilirlik Ayarları', 'Accessibility Settings')}
            style={{ position: 'absolute', bottom: 52, right: 0, width: 280, background: '#1e1b4b', border: '2px solid rgba(245,158,11,0.5)', borderRadius: 14, padding: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>♿ {t('Erişilebilirlik', 'Accessibility')}</div>
              <button onClick={() => setShowShortcuts(true)} style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>⌨️ ?</button>
            </div>

            <div className="a11y-panel-scroll">

              {/* ━━━ GÖRÜNÜM (Display) ━━━ */}
              <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 4 }}>
                {t('👁 Görünüm', '👁 Display')}
              </div>

              {/* Font Size — 4 Preset Levels */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                  {t('Yazı Boyutu', 'Font Size')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {[
                    { label: t('Normal', 'Normal'), size: 13, icon: 'A' },
                    { label: t('Büyük', 'Large'),   size: 16, icon: 'A' },
                    { label: t('Daha Büyük', 'X-Large'), size: 19, icon: 'A' },
                    { label: t('Dev', 'XX-Large'),  size: 22, icon: 'A' },
                  ].map(({ label, size, icon }) => {
                    const active = fontSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setFontSizeAbsolute(size)}
                        aria-label={label}
                        aria-pressed={active}
                        title={`${label} (${size}px)`}
                        style={{
                          padding: '5px 2px', borderRadius: 7, flexDirection: 'column',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                          background: active ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${active ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          color: active ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: size === 13 ? 11 : size === 16 ? 13 : size === 19 ? 15 : 18, fontWeight: 900, lineHeight: 1 }}>{icon}</span>
                        <span style={{ fontSize: 7, fontWeight: 700, lineHeight: 1 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Current px indicator + fine-tune */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 9, color: 'rgba(167,139,250,0.7)', fontWeight: 700 }}>{fontSize}px</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button onClick={() => changeFontSize(-1)}
                      aria-label={t('Küçült', 'Decrease')}
                      style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>−</button>
                    <button onClick={() => changeFontSize(1)}
                      aria-label={t('Büyüt', 'Increase')}
                      style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              </div>

              {/* Line Spacing */}
              <button onClick={cycleLineSpacing} aria-label={t('Satır aralığını değiştir', 'Change line spacing')} style={cycBtnStyle(lineSpacing !== 1.85)}>
                <span>📏 {t('Satır Aralığı', 'Line Spacing')}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{lineSpacing}x</span>
              </button>

              {/* Letter Spacing */}
              <button onClick={cycleLetterSpacing} aria-label={t('Harf aralığını değiştir', 'Change letter spacing')} style={cycBtnStyle(letterSpacing > 0)}>
                <span>🔤 {t('Harf Aralığı', 'Letter Spacing')}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{letterSpacing}px</span>
              </button>

              {/* Word Spacing */}
              <button onClick={cycleWordSpacing} aria-label={t('Kelime aralığını değiştir', 'Change word spacing')} style={cycBtnStyle(wordSpacing > 0)}>
                <span>↔️ {t('Kelime Aralığı', 'Word Spacing')}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{wordSpacing}px</span>
              </button>

              {/* High Contrast */}
              <button onClick={toggleContrast} aria-label={t('Yüksek kontrast', 'High contrast')} aria-pressed={highContrast} style={btnStyle(highContrast)}>
                🔲 {t('Yüksek Kontrast', 'High Contrast')} {highContrast ? '✓' : ''}
              </button>

              {/* ━━━ OKUMA (Reading) ━━━ */}
              <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                {t('📖 Okuma', '📖 Reading')}
              </div>

              {/* Dyslexia Font */}
              <button onClick={toggleDyslexiaFont} aria-label={t('Disleksi dostu font', 'Dyslexia-friendly font')} aria-pressed={dyslexiaFont} style={btnStyle(dyslexiaFont)}>
                🔤 {t('Disleksi Fontu', 'Dyslexia Font')} {dyslexiaFont ? '✓' : ''}
              </button>

              {/* Reading Guide */}
              <button onClick={toggleReadingGuide} aria-label={t('Okuma çizgisi', 'Reading guide')} aria-pressed={readingGuide} style={btnStyle(readingGuide)}>
                📏 {t('Okuma Çizgisi', 'Reading Guide')} {readingGuide ? '✓' : ''}
              </button>

              {/* Glossary */}
              <button onClick={toggleGlossary} aria-label={t('Sözlük ipuçları', 'Glossary tooltips')} aria-pressed={glossaryEnabled}
                style={btnStyle(glossaryEnabled, 'rgba(16,185,129')}>
                🏷️ {t('Sözlük İpuçları', 'Glossary Tooltips')} {glossaryEnabled ? '✓' : ''}
              </button>

              {/* Magnifier */}
              <button onClick={toggleMagnifier} aria-label={t('Büyüteç', 'Magnifier')} aria-pressed={magnifier}
                style={btnStyle(magnifier, 'rgba(168,85,247')}>
                🔍 {t('Büyüteç', 'Magnifier')} {magnifier ? '✓' : ''}
              </button>

              {/* ━━━ MODLAR (Modes) ━━━ */}
              <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                {t('🎨 Modlar', '🎨 Modes')}
              </div>

              {/* Calm Mode */}
              <button onClick={toggleCalm} aria-label={t('Sakin mod', 'Calm mode')} aria-pressed={calmMode}
                style={btnStyle(calmMode, 'rgba(16,185,129')}>
                🌿 {t('Sakin Mod', 'Calm Mode')} {calmMode ? '✓' : ''}
              </button>

              {/* Focus Mode */}
              <button onClick={toggleFocus} aria-label={t('Odak modu', 'Focus mode')} aria-pressed={focusMode}
                style={btnStyle(focusMode, 'rgba(59,130,246')}>
                🎯 {t('Odak Modu', 'Focus Mode')} {focusMode ? '✓' : ''}
              </button>

              {/* Theme Filter */}
              <button onClick={cycleThemeFilter} aria-label={t('Tema filtresi', 'Theme filter')} style={cycBtnStyle(themeFilter !== 'none')}>
                <span>{themeFilter === 'sepia' ? '☕' : themeFilter === 'blueLight' ? '🌙' : '🎨'} {t('Tema Filtresi', 'Theme Filter')}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{themeFilter === 'none' ? t('Kapalı', 'Off') : themeFilter === 'sepia' ? 'Sepia' : t('Gece', 'Night')}</span>
              </button>

              {/* Color Blind */}
              <button onClick={cycleColorBlind} aria-label={t('Renk körlüğü filtresi', 'Color blind filter')}
                style={cycBtnStyle(colorBlindMode !== 'none', 'rgba(236,72,153')}>
                <span>👁 {t('Renk Körlüğü', 'Color Blind')}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{colorBlindMode === 'none' ? t('Kapalı', 'Off') : colorBlindMode.charAt(0).toUpperCase() + colorBlindMode.slice(1)}</span>
              </button>

              {/* ━━━ SES (Audio) ━━━ */}
              <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                {t('🔊 Ses', '🔊 Audio')}
              </div>

              {/* TTS Speed */}
              <button onClick={cycleTtsSpeed} aria-label={t('Okuma hızı', 'Speech speed')}
                style={cycBtnStyle(ttsSpeed !== 1, 'rgba(139,92,246')}>
                <span>🗣️ {t('Okuma Hızı', 'Speech Speed')}</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>{ttsSpeed}x</span>
              </button>

              {/* ── TTS: Read Selection / Stop ── */}
              {tts && tts.isSupported && (
                <>
                  {!tts.isSpeaking ? (
                    <button onClick={handleReadSelection}
                      aria-label={t('Seçili metni oku', 'Read selected text')}
                      style={btnStyle(false, 'rgba(16,185,129')}>
                      🔊 {t('Seçili Metni Oku', 'Read Selection')}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                      <button onClick={() => tts.isPaused ? tts.resume() : tts.pause()}
                        aria-label={tts.isPaused ? t('Devam et', 'Resume') : t('Duraklat', 'Pause')}
                        style={{ ...btnStyle(true, 'rgba(245,158,11'), flex: 1, justifyContent: 'center' as const }}>
                        {tts.isPaused ? '▶️' : '⏸️'} {tts.isPaused ? t('Devam', 'Resume') : t('Duraklat', 'Pause')}
                      </button>
                      <button onClick={tts.stop}
                        aria-label={t('Durakla', 'Stop')}
                        style={{ ...btnStyle(true, 'rgba(239,68,68'), flex: 1, justifyContent: 'center' as const }}>
                        ⏹️ {t('Durdur', 'Stop')}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── STT: Microphone Input ── */}
              {stt && stt.isSupported && (
                <>
                  <button
                    onClick={() => stt.isListening ? stt.stopListening() : stt.startListening(lang)}
                    aria-label={stt.isListening ? t('Kaydı durdur', 'Stop recording') : t('Sesle giriş yap', 'Voice input')}
                    style={btnStyle(stt.isListening, stt.isListening ? 'rgba(239,68,68' : 'rgba(16,185,129')}>
                    {stt.isListening ? '⏹️' : '🎤'} {stt.isListening ? t('Kaydı Durdur', 'Stop Recording') : t('Sesle Giriş', 'Voice Input')}
                    {stt.isListening && <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />}
                  </button>

                  {/* Live transcript preview */}
                  {(stt.transcript || stt.interimTranscript) && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', marginBottom: 4, fontSize: 10 }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase' }}>
                        {t('Tanınan Metin', 'Recognized Text')}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, maxHeight: 60, overflowY: 'auto', wordBreak: 'break-word' }}>
                        {stt.transcript}
                        {stt.interimTranscript && <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}> {stt.interimTranscript}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        <button onClick={handlePasteTranscript}
                          style={{ flex: 1, padding: '4px 8px', borderRadius: 5, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                          📋 {t('Alana Yapıştır', 'Paste to Field')}
                        </button>
                        <button onClick={stt.resetTranscript}
                          style={{ padding: '4px 8px', borderRadius: 5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STT Error */}
                  {stt.error && (
                    <div style={{ fontSize: 9, color: '#f87171', padding: '4px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, marginBottom: 3 }}>
                      ⚠️ {stt.error}
                    </div>
                  )}
                </>
              )}

              {/* Browser support warnings */}
              {tts && !tts.isSupported && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 4 }}>
                  {t('Tarayıcınız sesli okumayı desteklemiyor', 'Your browser does not support text-to-speech')}
                </div>
              )}
              {stt && !stt.isSupported && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 4 }}>
                  {t('Tarayıcınız sesle girişi desteklemiyor', 'Your browser does not support voice input')}
                </div>
              )}

            </div>{/* end scroll container */}

            {/* ━━━ SIFIRLA ━━━ */}
            <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
              <button onClick={resetA11y} aria-label={t('Tüm ayarları sıfırla', 'Reset all settings')}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 700, fontSize: 10, cursor: 'pointer', transition: 'all 0.2s' }}>
                ↺ {t('Tümünü Sıfırla', 'Reset All')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reading Guide Overlay ── */}
      {readingGuide && <div className="reading-guide-line" style={{ top: readingGuideY - 1 }} />}

      {/* ── Theme Filter Overlays ── */}
      {themeFilter === 'sepia' && <div className="theme-sepia-overlay" />}
      {themeFilter === 'blueLight' && <div className="theme-bluelight-overlay" />}

      {/* ── SVG Filters for Color Blindness ── */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      {/* ── Keyboard Shortcuts Modal ── */}
      {showShortcuts && (
        <div className="a11y-shortcuts-backdrop" onClick={() => setShowShortcuts(false)}>
          <div className="a11y-shortcuts-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#a78bfa' }}>⌨️ {t('Klavye Kısayolları', 'Keyboard Shortcuts')}</div>
              <button onClick={() => setShowShortcuts(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            {allShortcuts.map(s => (
              <div key={s.key} className="a11y-shortcut-row">
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{lang === 'tr' ? s.desc_tr : s.desc_en}</span>
                <span className="a11y-shortcut-key">{s.key}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              {t('Metin alanı aktifken kısayollar çalışmaz', 'Shortcuts disabled while typing in text fields')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
