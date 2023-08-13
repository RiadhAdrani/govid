import { PropsWithUtility, useEffect, useMemo, useState } from '@riadh-adrani/ruvy';
import { NotificationItem } from '../../context/UI.context';
import Icon from '../Icon/Icon';

export interface NotificationProps extends NotificationItem {
  remove: () => void;
}

export default ({ component, duration, remove, type }: PropsWithUtility<NotificationProps>) => {
  const [shrink, setShrink] = useState(false);
  const transitionDuration = useMemo(() => 1000);

  const hide = () => {
    if (shrink) return;

    setShrink(true);

    setTimeout(() => {
      remove();
    }, transitionDuration);
  };

  useEffect(() => {
    setTimeout(hide, duration);
  });

  return (
    <div
      onClick={hide}
      style={{
        display: 'grid',
        transition: `grid-template-rows ${transitionDuration}ms`,
        gridTemplateRows: shrink ? '0fr' : '1fr',
        animation: `500ms ${shrink ? 'toast-out' : 'toast-in'}`,
      }}
    >
      <div class={'overflow-hidden'}>
        <div class={'bg-zinc-800 p-x-4 p-y-3 rounded row items-start gap-2'}>
          <div class={'w-25px h-25px row-center'} switch={type}>
            <Icon case={'success'} icon="i-mdi-check" class={'text-green'} />
            <Icon case={'danger'} icon="i-mdi-bell" class={'text-red'} />
            <Icon case={'warning'} icon="i-mdi-search" class={'text-yellow'} />
            <Icon case:default icon="i-mdi-user" />
          </div>
          {component}
        </div>
      </div>
    </div>
  );
};
