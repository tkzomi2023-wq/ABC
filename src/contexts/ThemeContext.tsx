import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ColorMode = 'light' | 'dark';

type ThemeContextType = {
  colorMode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colorMode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
});

const STORAGE_KEY = 'abc-color-mode';

function getInitialMode(): ColorMode {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>(getInitialMode);

  const applyMode = useCallback((mode: ColorMode) => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = mode;
  }, []);

  useEffect(() => {
    applyMode(colorMode);
    localStorage.setItem(STORAGE_KEY, colorMode);
  }, [colorMode, applyMode]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setColorModeState(e.matches ? 'dark' : 'light');
      }
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ colorMode, toggleColorMode, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
