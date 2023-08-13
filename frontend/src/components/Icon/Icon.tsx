import { joinClasses } from '@riadh-adrani/ruvy';

export interface IconProps extends HTMLElementProps {
  icon: string;
  light?: boolean;
  size?: string;
}

export const Icon = (props: IconProps) => {
  return <i {...props} class={`text-1em inline-flex ${props.icon} ${joinClasses(props.class)}`} />;
};

export const GiantIcon = (props: IconProps) => {
  return (
    <div
      class={[
        'text-5em cursor-pointer col-center p-20px rounded-50%',
        'bg-zinc-700 hover:bg-zinc-600',
      ]}
    >
      <Icon {...props} />
    </div>
  );
};

export default Icon;
