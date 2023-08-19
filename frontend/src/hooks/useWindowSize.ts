import { useEffect, useState } from '@riadh-adrani/ruvy';

export default () => {
  const [height, setHeight] = useState(innerHeight);
  const [width, setWidth] = useState(innerWidth);

  useEffect(() => {
    const listener = () => {
      setHeight(innerHeight);
      setWidth(innerWidth);
    };

    window.addEventListener('resize', listener);

    return () => window.removeEventListener('resize', listener);
  });

  return { height, width };
};
