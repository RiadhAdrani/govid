import { PropsWithUtility, useContext } from '@riadh-adrani/ruvy';
import { UserContext } from '../../context/User.context';
import CreateButton from './Create.button';
import NotificationButton from './Notification.button';
import UserButton from './User.button';
import Icon from '../Icon/Icon';

const NavBar = (_: PropsWithUtility) => {
  const { isAuthenticated } = useContext(UserContext);

  return (
    <>
      <div class="row fixed top-0px left-0px right-0px items-center justify-stretch h-[var(--nav-bar-height)] p-x-6 bg-zinc-900">
        <div class="row-center justify-start gap-5 flex-1">
          <button class={'icon-btn'}>
            <Icon icon="menu" size="1.5em" />
          </button>
          <a class="row-center gap-1 text-[color:inherit] hover:[color:inherit]" href="/">
            <Icon icon="youtube" class={'text-40px text-green-600'} />
            <h3 class="font-bold">Govid</h3>
          </a>
        </div>
        <div class="row flex-1 h-65% gap-2">
          <div class="row flex-1 rounded-10px w-100%">
            <div class="row gap-2 items-center flex-1 border border-solid border-1px border-zinc-800 rounded-s-20px p-x-3 focus-within:border-blue-800">
              <Icon icon="magnify" class="w-20px h-20px" />
              <input
                class="rounded-10px bg-transparent border-none focus:outline-none p-y-2.1 text-[1.05em] w-100%"
                placeholder="Search"
              />
            </div>
            <div class="row-center border border-solid border-1px border-zinc-800 p-x-3 p-y-1 rounded-e-20px bg-zinc-800">
              <Icon icon="magnify" size="1.5em" />
            </div>
          </div>
          <button class="icon-btn">
            <Icon icon="microphone" class="w-25px h-25px" />
          </button>
        </div>
        <div class="row-center justify-end gap-4 flex-1">
          <CreateButton if={isAuthenticated} />
          <NotificationButton if={isAuthenticated} />
          <UserButton if={isAuthenticated} />
          <a else href="/sign-in">
            <button class="icon-btn row-center aspect-auto rounded-15px p-x-5 p-y-1 gap-2 border border-solid border-1px border-blue-400 text-blue-400">
              <p>Sign in</p>
              <Icon icon="user" />
            </button>
          </a>
        </div>
      </div>
    </>
  );
};

export default NavBar;
