import { useEffect } from '@riadh-adrani/ruvy';
import { Callback } from '@riadh-adrani/utils';

export default (callback: Callback, ref: HTMLElement) => {
  const handleClick = (e: MouseEvent) => {
    if (ref && !ref.contains(e.target as Node)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);

    return () => document.removeEventListener('click', handleClick);
  }, callback);
};
