import { PropsWithUtility, useMemo } from '@riadh-adrani/ruvy';

export interface MenuProps {
  position:
    | 'top-left'
    | 'top'
    | 'top-right'
    | 'right'
    | 'bottom-right'
    | 'bottom'
    | 'bottom-left'
    | 'left';
  spacing?: string;
}

export default (props: PropsWithUtility<MenuProps>) => {
  const { position, spacing } = props;

  const computedPosition = useMemo(() => {
    if (position === 'bottom') {
      return 'top-100%';
    } else if (position === 'bottom-left') {
      return 'top-100% right-100%';
    } else if (position === 'bottom-right') {
      return 'top-100% left-100%';
    } else if (position === 'left') {
      return 'right-100%';
    } else if (position === 'right') {
      return 'left-100%';
    } else if (position === 'top') {
      return 'bottom-100%';
    } else if (position === 'top-left') {
      return 'bottom-100% right-100%';
    } else if (position === 'top-right') {
      return 'bottom-100% left-100%';
    } else {
      return 'top-100%';
    }
  }, props.position);

  return (
    <div class={['absolute bg-zinc-800 p-y-5px rounded-10px', computedPosition, spacing ?? '']}>
      {props.children}
    </div>
  );
};
