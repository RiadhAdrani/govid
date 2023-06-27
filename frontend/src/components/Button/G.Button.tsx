import { PropsWithUtility, joinClasses } from '@riadh-adrani/ruvy';

export type GButtonProps = PropsWithUtility<ComponentProps<HTMLButtonElement, ButtonProps>>;

export default (props: GButtonProps) => {
  return (
    <button
      {...props}
      class={joinClasses(
        ['p-x-2 p-y-2 rounded-15px', 'hover:opacity-90', 'active:opacity-70'],
        props.class
      )}
    >
      {props.children}
    </button>
  );
};
