import NavBarButton from './NavBar.button';
import GButton from '../Button/G.Button';
import { useContext } from '@riadh-adrani/ruvy';
import { UserContext } from '../../context/User.context';
import Icon from '../Icon/Icon';

export default () => {
  const { user, signout } = useContext(UserContext);

  const items: Array<{
    icon: string;
    label: string;
    onClick?: () => void;
    href?: string;
    topDivider?: boolean;
  }> = [
    { icon: 'i-mdi-user', label: 'Your channel', topDivider: true },
    { icon: 'i-mdi-video', label: 'Studio' },
    { icon: 'i-mdi-cog', label: 'Settings' },
    { icon: 'i-mdi-logout', label: 'Sign out', onClick: signout, topDivider: true },
  ];

  return (
    <NavBarButton
      icon="i-mdi-user"
      menu={(close) => (
        <div class="w-300px col p-y-2">
          <div class="row items-center gap-5 p-4">
            <Icon icon={'i-mdi-user'} class="w-50px h-50px" />
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
                if={it.topDivider == true}
                class="border-t-solid border-t-zinc-700 border-t-1px h-1px m-y-2"
              ></div>
              <GButton
                class={'bg-transparent hover:bg-zinc-700 rounded-0px! p-x-4 row items-center gap-5'}
                onClick={() => {
                  it.onClick?.();
                  close();
                }}
              >
                <Icon icon={it.icon} class="text-1.5em" />
                <span>{it.label}</span>
              </GButton>
            </>
          ))}
        </div>
      )}
    />
  );
};
