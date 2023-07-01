import NavBarButton from './NavBar.button';
import Icon, { IconName } from '../Icons/Icon';
import GButton from '../Button/G.Button';
import { useContext } from '@riadh-adrani/ruvy';
import { UserContext } from '../../context/User.context';

export default () => {
  const { user, signout } = useContext(UserContext);

  const items: Array<{
    icon: IconName;
    label: string;
    onClick?: () => void;
    href?: string;
    topDivider?: boolean;
  }> = [
    { icon: 'user', label: 'Your channel', topDivider: true },
    { icon: 'studio', label: 'Studio' },
    { icon: 'settings', label: 'Settings' },
    { icon: 'signout', label: 'Sign out', onClick: signout, topDivider: true },
  ];

  return (
    <NavBarButton
      icon="user"
      menu={(close) => (
        <div class="w-300px col p-y-2">
          <div class="row items-center gap-5 p-4">
            <Icon icon={'user'} class="w-50px h-50px" />
            <div class="col gap-1 items-start">
              <p>
                {user!.firstName} {user!.lastName}
              </p>
              <p>{user?.email}</p>
            </div>
          </div>
          {items.map((it) => (
            <>
              <div
                if={it.topDivider}
                class="border-t-solid border-t-zinc-700 border-t-1px h-1px m-y-2"
              ></div>
              <GButton
                class={'bg-transparent hover:bg-zinc-700 rounded-0px! p-x-4 row items-center gap-5'}
                onClick={() => {
                  it.onClick?.();
                  close();
                }}
              >
                <Icon icon={it.icon} class="w-30px h-30px" />
                <span>{it.label}</span>
              </GButton>
            </>
          ))}
        </div>
      )}
    />
  );
};
