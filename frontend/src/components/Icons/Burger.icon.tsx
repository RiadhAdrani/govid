import { SVGIconProps } from './Icon';

export default (props: SVGIconProps) => {
  return (
    <svg
      height="24"
      viewBox="0 0 24 24"
      width="24"
      focusable="false"
      fill="currentColor"
      {...props}
    >
      <path d="M21 6H3V5h18v1zm0 5H3v1h18v-1zm0 6H3v1h18v-1z"></path>
    </svg>
  );
};
