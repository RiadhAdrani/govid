import { useContext } from '@riadh-adrani/ruvy';
import { UserContext } from '../context/User.context';
import GButton from '../components/Button/G.Button';

export default () => {
  const { isAuthenticated, signout } = useContext(UserContext);
  return (
    <>
      <div if={isAuthenticated} class="col gap-2">
        <span>User related videos</span>
        <GButton onClick={signout}>Sign out</GButton>
      </div>
      <div else class="col gap-2">
        General audience videos
        <a href="/sign-in">Sign in</a>
      </div>
    </>
  );
};
