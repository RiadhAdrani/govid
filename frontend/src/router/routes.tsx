import { RawRoute, RuvyNode } from '@riadh-adrani/ruvy';
import HomePage from '../pages/Home.page';
import SigninPage from '../pages/Signin.page';
import SignupPage from '../pages/Signup.page';
import WatchPage from '../pages/Watch.page';
import UploadPage from '../pages/Upload.page';
import ChannelPage from '../pages/Channel.page';

const ROUTES: Array<RawRoute<RuvyNode>> = [
  { path: '/', name: 'Home', component: <HomePage />, title: 'Home' },
  { path: '/sign-in', name: 'SignIn', component: <SigninPage />, title: 'Sign in' },
  { path: '/sign-up', name: 'SignUp', component: <SignupPage />, title: 'Sign up' },
  { path: '/watch', name: 'Watch', component: <WatchPage />, title: 'Watch video' },
  { path: '/upload', name: 'Upload', component: <UploadPage />, title: 'Upload Video' },
  { path: '/user/:id', name: 'User', component: <ChannelPage />, title: 'User Channel' },
];

export default ROUTES;
