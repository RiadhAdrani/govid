import { PropsWithUtility, joinClasses } from '@riadh-adrani/ruvy';
import BellIcon from '../Icons/Bell.icon';

export type NotificationButtonProps = PropsWithUtility<
  HTMLElementProps<HTMLButtonElement, ButtonProps>
>;

export default (props: NotificationButtonProps) => {
  return (
    <button {...props} class={joinClasses('icon-btn', props.class)}>
      <BellIcon height={20} width={20} />
    </button>
  );
};
