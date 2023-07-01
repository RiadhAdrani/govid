import { useMemo } from '@riadh-adrani/ruvy';
import GButton from '../Button/G.Button';
import Icon, { IconName } from '../Icons/Icon';
import NavBarButton from './NavBar.button';

export default () => {
  const items = useMemo(() => [
    { label: 'Upload video', onClick: () => {}, icon: 'upload' },
    { label: 'Create post', onClick: () => {}, icon: 'write' },
  ]);

  return (
    <NavBarButton
      icon="create"
      menu={(close) => (
        <div class="whitespace-nowrap col gap-1 p-y-2">
          {items.map((it) => (
            <GButton
              class="bg-transparent hover:bg-zinc-700 rounded-0px! p-x-4 row items-center justify-between gap-5"
              onClick={() => {
                it.onClick();
                close();
              }}
            >
              <Icon icon={it.icon as IconName} width={25} height={25} />
              <span>{it.label}</span>
            </GButton>
          ))}
        </div>
      )}
    />
  );
};
