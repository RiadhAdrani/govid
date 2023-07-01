import { SVGIconProps } from './Icon';
export default (props: SVGIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      focusable="false"
      fill={'currentColor'}
      height="24"
      width="24"
      {...props}
    >
      <path d="M15.01,7.34l1.64,1.64L8.64,17H6.99v-1.64L15.01,7.34 M15.01,5.92l-9.02,9.02V18h3.06l9.02-9.02L15.01,5.92L15.01,5.92z M17.91,4.43l1.67,1.67l-0.67,0.67L17.24,5.1L17.91,4.43 M17.91,3.02L15.83,5.1l3.09,3.09L21,6.11L17.91,3.02L17.91,3.02z M21,10h-1 v10H4V4h10V3H3v18h18V10z"></path>
    </svg>
  );
};
