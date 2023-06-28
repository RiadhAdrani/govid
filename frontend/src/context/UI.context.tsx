import { Theme } from '../types/types.js';
import {
  Portal,
  createContext,
  getPathname,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from '@riadh-adrani/ruvy';
import { isDarkMode } from '../utils/utils.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import GoogleSpinner from '../components/Spinner/Google.spinner.js';

interface IUIConext {
  theme: Theme;
  computedTheme: Theme;
  toggleTheme: (v?: Theme) => void;
  showTopNavBar: boolean;
  toggleLoader: (v?: boolean) => void;
}

export const UIContext = createContext<IUIConext>({
  theme: Theme.Device,
  computedTheme: Theme.Light,
  toggleTheme: () => 0,
  showTopNavBar: true,
  toggleLoader: () => 0,
});

export const UIProvider = ({ children }: { children?: unknown }) => {
  const [theme, setTheme] = useLocalStorage('@riadh-adrani-ruvy-docs-theme', Theme.Device);
  const [showLoader, setShowLoader] = useState(false);

  const computedTheme = useMemo<Theme>(
    () => (theme !== Theme.Device ? theme : isDarkMode() ? Theme.Dark : Theme.Light),
    theme
  );

  const showTopNavBar = useMemo<boolean>(() => {
    const pathname = getPathname();

    return !['/sign-in', '/sign-up'].includes(pathname);
  }, getPathname());

  useEffect(() => {
    document.querySelector(':root')?.setAttribute('data-theme', computedTheme);
  }, computedTheme);

  const toggleTheme = useCallback((value?: Theme) => {
    const v: Theme = value ?? computedTheme === Theme.Dark ? Theme.Light : Theme.Dark;

    setTheme(v);
  }, theme);

  const toggleLoader = (value?: boolean) => {
    setShowLoader(value !== undefined ? value : !showLoader);
  };

  return (
    <UIContext.Provider value={{ theme, computedTheme, toggleTheme, showTopNavBar, toggleLoader }}>
      {children}
      <Portal container={document.body}>
        <div if={showLoader} class={['z-99999999 fixed inset-0px col-center bg-[#0e0e0edd]']}>
          <GoogleSpinner />
        </div>
      </Portal>
    </UIContext.Provider>
  );
};
