import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'cil_theme';

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved, animate = false) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-transitioning');
  }
  root.dataset.theme = resolved;
  if (animate) {
    setTimeout(() => root.classList.remove('theme-transitioning'), 350);
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  const resolved = mode === 'system' ? getSystemTheme() : mode;
  const isFirstRender = useRef(true);

  useEffect(() => {
    // On first render, apply instantly (no animation flash)
    // On subsequent state changes (e.g., from system theme change), also no animation
    applyTheme(resolved, false);
    isFirstRender.current = false;
  }, [resolved]);

  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setThemeMode = useCallback((next) => {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    // Apply with animation BEFORE React state update
    applyTheme(next, true);
    setThemeMode(next);
  }, [resolved, setThemeMode]);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode: setThemeMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
