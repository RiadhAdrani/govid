import { PropsWithUtility, joinClasses, useMemo, useRef, useState } from '@riadh-adrani/ruvy';
import CreateIcon from '../Icons/Create.icon';
import GMenu from '../Button/G.Menu';
import GButton from '../Button/G.Button';
import UploadVideoIcon from '../Icons/UploadVideo.icon';
import CreatePostIcon from '../Icons/CreatePost.icon';
import useClickOutside from '../../hooks/useClickOutside';

export type CreateButtonProps = PropsWithUtility<HTMLElementProps<HTMLButtonElement, ButtonProps>>;

export default (props: CreateButtonProps) => {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLElement>();

  const items = useMemo(() => [
    { label: 'Upload video', onClick: () => {}, icon: <UploadVideoIcon /> },
    { label: 'Create post', onClick: () => {}, icon: <CreatePostIcon /> },
  ]);

  useClickOutside(() => setShow(false), ref.value!);

  return (
    <div class="relative" ref={ref}>
      <button
        {...props}
        class={joinClasses('icon-btn relative', props.class)}
        onClick={() => setShow(!show)}
      >
        <CreateIcon height={20} width={20} />
      </button>
      <GMenu if={show}>
        <div class="whitespace-nowrap col gap-1 p-y-2">
          {items.map((it) => (
            <GButton
              class="bg-transparent hover:bg-zinc-700 rounded-0px! p-x-4 row items-center justify-between gap-5"
              onClick={() => {
                it.onClick();
                setShow(false);
              }}
            >
              {it.icon}
              <span>{it.label}</span>
            </GButton>
          ))}
        </div>
      </GMenu>
    </div>
  );
};
