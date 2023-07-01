import { SVGIconProps } from './Icon';

export default (props: SVGIconProps) => {
  return (
    <svg
      height="24"
      viewBox="0 0 24 24"
      width="24"
      fill="currentcolor"
      focusable="false"
      {...props}
    >
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.8 17.3l-4.2-4.1L7 11.8l2.8 2.7L17 7.4l1.4 1.4-8.6 8.5z"></path>
    </svg>
  );
};
