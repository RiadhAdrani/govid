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
  const { toggleLoader } = useContext(UIContext);
  const [user, setUser] = useState<PublicUser | undefined>({
    email: 'riadh@adrani.com',
    firstName: 'Adrani',
    id: 0,
    lastName: 'Riadh',
  });

  const getUserData = async () => {
    const token = Cookies.get('token');

    // show loader
    toggleLoader(true);

    if (!token) {
      // token expired
      // show a toast saying that token expired or invalid
      toggleLoader(false);

      return;
    }

    const res = await useApi.get<{ user: PublicUser }>('/users/me');

    if (res?.data) {
      // redirect user to home page
      setUser(res.data.user);
      navigate('/');
    } else {
      // failed to sign in
    }

    // hide loader
    toggleLoader(false);
  };

  const isAuthenticated = useMemo(() => user !== undefined, user);

  const signin: SigninFunction = async (body) => {
    const res = await useApi.post<{ token: string }>('/signin', body);

    if (res?.data) {
      const token = res.data.token;

      Cookies.set('token', token);

      getUserData();
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
