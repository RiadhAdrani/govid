import { Theme } from '../types/types.js';
import {
  Portal,
  RuvyNode,
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
import Toast from '../components/Toast/Toast.js';

const loaderIndex = 9000;
const toastIndex = loaderIndex + 1;

const container = document.createElement('div');
document.body.appendChild(container);

interface IUIConext {
  theme: Theme;
  computedTheme: Theme;
  toggleTheme: (v?: Theme) => void;
  showTopNavBar: boolean;
  toggleLoader: (v?: boolean) => void;
  showToast: (props: Omit<NotificationItem, 'id'>) => void;
}

export const UIContext = createContext<IUIConext>({
  theme: Theme.Device,
  computedTheme: Theme.Light,
  toggleTheme: () => 0,
  showTopNavBar: true,
  toggleLoader: () => 0,
  showToast: () => 0,
});

export interface NotificationItem {
  id: string;
  component: RuvyNode;
  duration: number;
  type: 'info' | 'danger' | 'success' | 'warning';
}

export const UIProvider = ({ children }: { children?: unknown }) => {
  const [theme, setTheme] = useLocalStorage('@riadh-adrani-ruvy-docs-theme', Theme.Device);
  const [showLoader, setShowLoader] = useState(false);
  const [notifications, setNotification, getNotification] = useState<Array<NotificationItem>>([]);

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

  const removeToast = (id: string) => {
    setNotification(getNotification().filter((it) => it.id !== id));
  };

  const showToast = (props: Omit<NotificationItem, 'id'>) => {
    const item = { ...props, id: Date.now().toString() };

    setNotification([...getNotification(), item]);
  };

  return (
    <UIContext.Provider
      value={{ theme, computedTheme, toggleTheme, showTopNavBar, toggleLoader, showToast }}
    >
      {children}
      <Portal container={container}>
        <div if={false} class={[`z-${loaderIndex}`, 'fixed inset-0px col-center bg-[#0e0e0edd]']}>
          <GoogleSpinner />
        </div>
        <div
          if={notifications.length > 0}
          class={[`z-${toastIndex} col-reverse fixed right-0 bottom-0 m-10 w-300px gap-5`]}
        >
          {[...notifications].map((it) => (
            <Toast {...it} key={it.id} remove={() => removeToast(it.id)} />
          ))}
        </div>
      </Portal>
    </UIContext.Provider>
  );
};
