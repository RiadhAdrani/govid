import { useCallback, useState } from '@riadh-adrani/ruvy';

const useToggle = (initialValue: boolean): [boolean, (v?: boolean) => void] => {
  const [get, set] = useState(initialValue);

  const toggle = useCallback((v?: boolean) => {
    set(typeof v === 'boolean' ? v : !get);
  }, get);

  return [get, toggle];
};

export default useToggle;
