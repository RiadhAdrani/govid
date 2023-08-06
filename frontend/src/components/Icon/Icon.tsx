import { joinClasses, useMemo } from '@riadh-adrani/ruvy';

export interface IconProps extends HTMLElementProps<HTMLDivElement> {
  icon: string;
  light?: boolean;
  size?: string;
}

export default (props: IconProps) => {
  const prefix = useMemo(() => (props.light ? 'mdi-light' : 'mdi'), props.light);

  return (
    <div
      {...props}
      if
      class={joinClasses(`text-${props.size ?? '1em'}`, props.class, `i-${prefix}-${props.icon}`)}
    />
  );
};
