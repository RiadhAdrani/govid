import { navigate, useMemo } from '@riadh-adrani/ruvy';
import Icon, { IconName } from '../Icons/Icon';
import NavBarButton from './NavBar.button';

export default () => {
  const items = useMemo(() => [
    { label: 'Upload video', href: { name: 'Upload' }, icon: 'upload' },
    { label: 'Create post', href: { name: 'Post' }, icon: 'write' },
  ]);

  return (
    <NavBarButton
      icon="create"
      menu={(close) => (
        <div class="whitespace-nowrap col gap-1 p-y-2">
          {items.map((it) => (
            <a
              href={it.href}
              class="color-inherit hover:color-inherit bg-transparent hover:bg-zinc-700 rounded-0px! p-x-4 row items-center justify-between gap-5 p-x-2 p-y-2 rounded-15px hover:opacity-90 active:opacity-70"
              onClick={(e) => {
                e.preventDefault();
                navigate(it.href);
                close();
              }}
            >
              <Icon icon={it.icon as IconName} class="w-25px h-25px" />
              <span>{it.label}</span>
            </a>
          ))}
        </div>
      )}
    />
  );
};
