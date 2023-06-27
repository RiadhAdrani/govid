import { PropsWithUtility, joinClasses } from '@riadh-adrani/ruvy';

export type GInputProps = PropsWithUtility<ComponentProps<HTMLInputElement, InputProps>>;

export default (props: GInputProps) => {
  return (
    <input
      {...props}
      class={joinClasses(
        [
          'p-4 rounded-5px border-solid border-1px bg-transparent border-[#2e2e2e]',
          'hover:opacity-70',
          'focus:outline-blue foucs:outline-1px focus:outline-solid',
        ],
        props.class
      )}
    >
      {props.children}
    </input>
  );
};
