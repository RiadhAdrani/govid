import { Theme } from '../types/types.js';
import { createContext, useCallback, useEffect, useMemo } from '@riadh-adrani/ruvy';
import { isDarkMode } from '../utils/utils.js';
import useLocalStorage from '../hooks/useLocalStorage.js';

interface IUIConext {
  theme: Theme;
  computedTheme: Theme;
  toggleTheme: (v?: Theme) => void;
}

export const UIContext = createContext<IUIConext>({
  theme: Theme.Device,
  computedTheme: Theme.Light,
  toggleTheme: () => 0,
});

export const UIProvider = ({ children }: { children?: unknown }) => {
  const [theme, setTheme] = useLocalStorage('@riadh-adrani-ruvy-docs-theme', Theme.Device);

  const computedTheme = useMemo(() => {
    if (theme !== Theme.Device) {
      return theme;
    }

    return isDarkMode() ? Theme.Dark : Theme.Light;
  }, theme);

  useEffect(() => {
    document.querySelector(':root')?.setAttribute('data-theme', computedTheme);
  }, computedTheme);

  const toggleTheme = useCallback((value?: Theme) => {
    const v: Theme = value ?? computedTheme === Theme.Dark ? Theme.Light : Theme.Dark;

    setTheme(v);
  }, theme);

  return (
    <UIContext.Provider value={{ theme, computedTheme, toggleTheme }}>
      {children}
    </UIContext.Provider>
  );
};
