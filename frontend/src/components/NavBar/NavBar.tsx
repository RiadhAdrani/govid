import { PropsWithUtility, useContext } from '@riadh-adrani/ruvy';
import BellIcon from '../Icons/Bell.icon';
import BurgerIcon from '../Icons/Burger.icon';
import CreateIcon from '../Icons/Create.icon';
import MicrophoneIcon from '../Icons/Microphone.icon';
import SearchIcon from '../Icons/Search.icon';
import UserIcon from '../Icons/User.icon';
import { UserContext } from '../../context/User.context';

const NavBar = (_: PropsWithUtility<{}>) => {
  const { isAuthenticated } = useContext(UserContext);

  const shortcuts = [
    {
      icon: <CreateIcon height={20} width={20} />,
      label: 'Create',
    },
    {
      icon: <BellIcon height={20} width={20} />,
      label: 'Notification',
    },
  ];

  console.log(isAuthenticated);

  return (
    <>
      <div class="row fixed top-0px left-0px right-0px items-center justify-stretch h-[var(--nav-bar-height)] p-x-6">
        <div class="row-center justify-start gap-5 flex-1">
          <button class={'icon-btn'}>
            <BurgerIcon height={20} width={20} />
          </button>
          <h3 class="text-green-500 font-bold text-upper">GoVid</h3>
        </div>
        <div class="row flex-1 h-65% gap-2">
          <div class="row flex-1 rounded-10px w-100%">
            <div class="row gap-2 items-center flex-1 border border-solid border-1px border-zinc-800 rounded-s-20px p-x-3 focus-within:border-blue-800">
              <SearchIcon height={20} width={20} />
              <input
                class="rounded-10px bg-transparent border-none focus:outline-none p-y-2.1 text-[1.05em] w-100%"
                placeholder="Search"
              />
            </div>
            <div class="row-center border border-solid border-1px border-zinc-800 p-x-3 p-y-1 rounded-e-20px bg-zinc-800">
              <SearchIcon height={23} width={23} />
            </div>
          </div>
          <button class="icon-btn">
            <MicrophoneIcon height={20} width={20} />
          </button>
        </div>
        <div class="row-center justify-end gap-4 flex-1">
          <>
            {shortcuts.map((it) => (
              <button class="icon-btn" title={it.label} if={isAuthenticated}>
                {it.icon}
              </button>
            ))}
          </>
          <>
            <button if={isAuthenticated} class="icon-btn">
              <UserIcon />
            </button>
            <a if={!isAuthenticated} href="/sign-in">
              <button class="icon-btn row-center aspect-auto rounded-15px p-x-5 p-y-1 gap-2 border border-solid border-1px border-blue-400 text-blue-400">
                <p>Sign in</p>
                <UserIcon />
              </button>
            </a>
          </>
        </div>
      </div>
    </>
  );
};

export default NavBar;
