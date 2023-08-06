import { useMemo } from '@riadh-adrani/ruvy';
import NavBarButton from './NavBar.button';
import Icon from '../Icon/Icon';

export default () => {
  const items = useMemo(() => [
    { label: 'Upload video', href: { name: 'Upload' }, icon: 'upload' },
    { label: 'Create post', href: { name: 'Post' }, icon: 'note' },
  ]);

  return (
    <NavBarButton
      icon="video-plus"
      menu={(close) => (
        <div class="whitespace-nowrap col gap-1 p-y-2">
          {items.map((it) => (
            <a
              href={it.href}
              class="color-inherit hover:color-inherit bg-transparent hover:bg-zinc-700 rounded-0px! p-x-4 row items-center justify-between gap-5 p-x-2 p-y-2 rounded-15px hover:opacity-90 active:opacity-70"
              onClick:prevent={close}
            >
              <Icon icon={it.icon} />
              <span>{it.label}</span>
            </a>
          ))}
        </div>
      )}
    />
  );
};
