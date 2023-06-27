import { PropsWithUtility, createContext, useState } from '@riadh-adrani/ruvy';
import { PublicUser, SigninFunction, SignupFunction } from '../types/user.js';
import axios from 'axios';
import useApi from '../utils/api.js';

interface IUserContext {
  signin: SigninFunction;
  signup: SignupFunction;
}

export const UserContext = createContext<IUserContext>({
  signin: async () => {},
  signup: async () => {},
});

export const UserProvider = ({ children }: PropsWithUtility<{}>) => {
  const [user, setUser] = useState<PublicUser | undefined>(undefined);

  const signin: SigninFunction = async () => {};

  const signup: SignupFunction = async (body) => {
    await useApi.post('/signup', body);
  };

  return <UserContext.Provider value={{ signin, signup }}>{children}</UserContext.Provider>;
};
