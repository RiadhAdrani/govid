import {
  DOMEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useReactive,
  useRef,
} from '@riadh-adrani/ruvy';
import { Callback, clamp } from '@riadh-adrani/utils';

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  width?: string;
  onChange: (v: number) => void;
}

export default (props: SliderProps) => {
  const ref = useRef<HTMLDivElement>();
  const state = useReactive({ isPressed: false });

  useEffect(() => {
    const mouseup = () => {
      state.isPressed = false;
    };

    const mousemove: DOMEventHandler<MouseEvent, HTMLDivElement> = (e) => {
      if (!state.isPressed || !ref.value) return;

      const { pageX } = e;
      const { width, left, right } = ref.value.getBoundingClientRect();

      const x = clamp(left, pageX, right);

      const value = (x - left) / width;

      props.onChange(value);
    };

    document.addEventListener('mouseup', mouseup);
    document.addEventListener('mousemove', mousemove as Callback);

    const remove = () => {
      document.removeEventListener('mouseup', mouseup);
      document.removeEventListener('mousemove', mousemove as Callback);
    };

    return remove;
  });

  const position = useMemo<number>(() => {
    if (!ref.value) return 0;

    const { width } = ref.value.getBoundingClientRect();

    const value = clamp(0, width * props.value, width - 15);

    return value;
  }, [ref.value, props.value]);

  const onMouseDown = useCallback(() => {
    state.isPressed = true;
  });

  return (
    <div ref={ref} class={['h-3px bg-zinc-700 relative row', `w-75px`]}>
      <div
        class="absolute h-15px w-15px bg-white rounded-50% self-center"
        style={{ left: `${position}px` }}
        onMouseDown={onMouseDown}
      />
      <div
        class={'h-3px bg-zinc-300 m-l-0px'}
        style={{ width: `${(props.value / props.max) * 100}%` }}
      />
    </div>
  );
};
