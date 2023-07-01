import { PropsWithUtility } from '@riadh-adrani/ruvy';

export default (props: PropsWithUtility<{ ref?: HTMLElement }>) => {
  return (
    <div class="absolute top-100% right-25% m-10px bg-zinc-800 p-y-5px rounded-10px">
      {props.children}
    </div>
  );
};
