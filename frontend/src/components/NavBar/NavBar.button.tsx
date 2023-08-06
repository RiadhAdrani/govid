import { PropsWithUtility, RuvyNode, joinClasses, useRef, useState } from '@riadh-adrani/ruvy';
import GMenu from '../Menu/G.Menu';
import useClickOutside from '../../hooks/useClickOutside';
import Icon from '../Icon/Icon';
// import Icon, { IconName } from '../Icons/Icon';

export interface NavBarButtonProps {
  icon: string;
  menu: (close: () => void) => RuvyNode;
}

export type CreateButtonProps = PropsWithUtility<HTMLElementProps<HTMLButtonElement, ButtonProps>>;

export default (props: PropsWithUtility<NavBarButtonProps>) => {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>();

  useClickOutside(() => setShow(false), ref.value!);

  return (
    <div class="relative" ref={ref}>
      <button class={joinClasses('icon-btn relative text-1.25em')} onClick={() => setShow(!show)}>
        <Icon icon={props.icon} />
      </button>
      <GMenu if={show} spacing="m-t-10px" position="bottom-left">
        {props.menu(() => setShow(false))}
      </GMenu>
    </div>
  );
};
