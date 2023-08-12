import {
  PropsWithUtility,
  createContext,
  navigate,
  useContext,
  useEffect,
  useMemo,
  useState,
} from '@riadh-adrani/ruvy';
import { PublicUser, SigninFunction, SignupFunction } from '../types/user.js';
import useApi from '../utils/api.js';
import Cookies from 'js-cookie';
import { UIContext } from './UI.context.js';

interface IUserContext {
  signin: SigninFunction;
  signup: SignupFunction;
  signout: () => void;
  isAuthenticated: boolean;
  user: PublicUser | undefined;
}

export const UserContext = createContext<IUserContext>({
  signin: async () => {},
  signup: async () => {},
  isAuthenticated: false,
  signout: () => {},
  user: undefined,
});

export const UserProvider = ({ children }: PropsWithUtility<{}>) => {
  const { toggleLoader, showToast } = useContext(UIContext);
  const [user, setUser] = useState<PublicUser | undefined>(undefined);

  const getUserData = async () => {
    const token = Cookies.get('token');

    // show loader
    toggleLoader(true);

    if (!token) {
      // token expired
      // show a toast saying that token expired or invalid
      toggleLoader(false);

      showToast({
        component: 'No token found, please sign in again',
        duration: 3000,
        type: 'danger',
      });

      return;
    }

    try {
      const res = await useApi.get<{ user: PublicUser }>('/users/me');

      // redirect user to home page
      setUser(res.data.user);

      showToast({ component: 'Signed in successfully', duration: 3000, type: 'success' });
    } catch (error) {
      showToast({
        component: 'Unable to verify token',
        duration: 3000,
        type: 'danger',
      });
    }

    // hide loader
    toggleLoader(false);
  };

  const isAuthenticated = useMemo(() => user !== undefined, user);

  const signin: SigninFunction = async (body) => {
    try {
      const res = await useApi.post<{ token: string }>('/signin', body);

      if (res?.data.token) {
        const token = res.data.token;

        Cookies.set('token', token);

        await getUserData();
      } else {
        showToast({ component: 'Unable to retrieve token', duration: 3000, type: 'danger' });
      }
    } catch (error) {
      showToast({ component: 'Unable to Signin', duration: 3000, type: 'danger' });
    } finally {
      toggleLoader(false);
    }
  };

  const signup: SignupFunction = async (body) => {
    await useApi.post('/signup', body);
  };

  const signout = () => {
    // remove the token from the cookies
    Cookies.remove('token');

    // nullify the user
    setUser(undefined);

    // redirect to sign-in page
    navigate('/sign-in');
  };

  useEffect(() => {
    getUserData();
  });

  return (
    <UserContext.Provider value={{ signin, signup, signout, isAuthenticated, user }}>
      {children}
    </UserContext.Provider>
  );
};
