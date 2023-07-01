import { PropsWithUtility, joinClasses } from '@riadh-adrani/ruvy';
import UserIcon from '../Icons/User.icon';

export type CreateButtonProps = PropsWithUtility<HTMLElementProps<HTMLButtonElement, ButtonProps>>;

export default (props: CreateButtonProps) => {
  return (
    <button {...props} class={joinClasses('icon-btn', props.class)}>
      <UserIcon height={20} width={20} />
    </button>
  );
};
