import { joinClasses } from '@riadh-adrani/ruvy';

export interface IconProps extends HTMLElementProps {
  icon: string;
  light?: boolean;
  size?: string;
}

export default (props: IconProps) => {
  return <i {...props} class={`text-1em ${props.icon} ${joinClasses(props.class)}`} />;
};
