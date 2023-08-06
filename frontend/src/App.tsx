import { Outlet, useContext } from '@riadh-adrani/ruvy';
import NavBar from './components/NavBar/NavBar';
import { UIContext, UIProvider } from './context/UI.context';
import { UserProvider } from './context/User.context';

const AppWrapper = () => {
  const { showTopNavBar } = useContext(UIContext);

  return (
    <>
      <NavBar if={showTopNavBar} />
      <Outlet />
    </>
  );
};

export default () => {
  return (
    <UIProvider>
      <UserProvider>
        <div class="p-t-[var(--nav-bar-height)] col flex-1">
          <AppWrapper />
        </div>
      </UserProvider>
    </UIProvider>
  );
};
