import { PropsWithUtility } from '@riadh-adrani/ruvy';
import BellIcon from '../Icons/Bell.icon';
import BurgerIcon from '../Icons/Burger.icon';
import CreateIcon from '../Icons/Create.icon';
import MicrophoneIcon from '../Icons/Microphone.icon';
import SearchIcon from '../Icons/Search.icon';
import UserIcon from '../Icons/User.icon';

const NavBar = (_: PropsWithUtility<{}>) => {
  const shortcuts = [
    {
      icon: <CreateIcon />,
      label: 'Create',
    },
    {
      icon: <BellIcon />,
      label: 'Notification',
    },
    {
      icon: <UserIcon />,
      label: 'User',
    },
  ];

  return (
    <>
      <div class="row fixed top-0px left-0px right-0px items-center justify-stretch h-[var(--nav-bar-height)] p-x-6">
        <div class="row-center justify-start gap-5 flex-1">
          <BurgerIcon />
          <p>Govid</p>
        </div>
        <div class="row flex-1 h-75% gap-2">
          <div class="row flex-1 rounded-10px w-100%">
            <div class="row gap-2 items-center flex-1 border border-solid border-1px border-gray rounded-s-20px p-x-3 ">
              <SearchIcon />
              <input class="flex-1 rounded-10px bg-transparent border-none focus:outline-none p-y-2.1 text-[1.05em]" />
            </div>
            <div class="row-center border border-solid border-1px border-gray p-x-3 p-y-1 rounded-e-20px bg-[#1e1e1e]">
              <SearchIcon />
            </div>
          </div>
          <button>
            <MicrophoneIcon />
          </button>
        </div>
        <div class="row-center justify-end gap-4 flex-1">
          {shortcuts.map((it) => (
            <button class="col-center bg-transparent" title={it.label}>
              {it.icon}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default NavBar;
