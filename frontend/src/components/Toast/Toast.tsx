import { PropsWithUtility, useEffect, useMemo, useState } from '@riadh-adrani/ruvy';
import { NotificationItem } from '../../context/UI.context';
import Check from '../Icons/Check';
import Help from '../Icons/Help';

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
          <div class={'w-25px h-25px row-center'}>
            <Check if={type === 'success'} class="text-green" />
            <Help if={type === 'info'} />
            <Help if={type === 'danger'} class="text-red" />
            <Help if={type === 'warning'} class="text-yellow" />
          </div>
          {component}
        </div>
      </div>
    </div>
  );
};
