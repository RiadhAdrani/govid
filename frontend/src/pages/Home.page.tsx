import { useContext } from '@riadh-adrani/ruvy';
import { UserContext } from '../context/User.context';
import GButton from '../components/Button/G.Button';

export default () => {
  const { isAuthenticated, signout } = useContext(UserContext);

  return (
    <>
      <div if={isAuthenticated} class="col">
        <span>User related videos</span>
        <GButton onClick={signout}>Sign out</GButton>
      </div>
      <div if={!isAuthenticated} class="col">
        General audience videos
        <a href="/sign-in">Sign in</a>
      </div>
    </>
  );
};
