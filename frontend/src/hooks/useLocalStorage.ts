import { StateArray, useEffect, useState } from '@riadh-adrani/ruvy';

const useLocalStorage = <T>(key: string, initValue: T): StateArray<T> => {
  const [value, set, get] = useState<T>(
    localStorage.getItem(key) !== null
      ? (JSON.parse(localStorage.getItem(key) as string) as T)
      : initValue
  );

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value]);

  return [value, set, get];
};

export default useLocalStorage;
