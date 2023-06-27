import { RawRoute, RuvyNode } from '@riadh-adrani/ruvy';
import HomePage from '../pages/Home.page';
import SigninPage from '../pages/Signin.page';
import SignupPage from '../pages/Signup.page';

const ROUTES: Array<RawRoute<RuvyNode>> = [
  { path: '/', component: <HomePage />, title: 'Home' },
  { path: '/sign-in', component: <SigninPage />, title: 'Sign in' },
  { path: '/sign-up', component: <SignupPage />, title: 'Sign up' },
];

export default ROUTES;
