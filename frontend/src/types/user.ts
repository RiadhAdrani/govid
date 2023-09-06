export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  subCount: number;
  subscribed: boolean;
}

export type PublicUser = Omit<User, 'password'>;

export type SignupBody = Omit<User, 'id'>;
export type SignupFunction = (body: SignupBody) => Promise<void>;

export type SigninBody = Pick<User, 'email' | 'password'>;
export type SigninFunction = (body: SigninBody) => Promise<void>;
