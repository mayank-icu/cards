import { useEffect, useMemo, useRef, useState } from 'react';

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const stableStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

const useFormDraft = (storageKey, initialValue, debounceMs = 700) => {
  const initialSerialized = useRef(stableStringify(initialValue));

  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? safeParse(raw) : null;
    return parsed ?? initialValue;
  });

  const serialized = useMemo(() => stableStringify(value), [value]);

  const isDirty = useMemo(() => {
    return serialized !== initialSerialized.current;
  }, [serialized]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const existing = localStorage.getItem(storageKey);
      if (existing !== serialized) {
        localStorage.setItem(storageKey, serialized);
      }
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [storageKey, serialized, debounceMs]);

  const clearDraft = () => {
    localStorage.removeItem(storageKey);
  };

  const markClean = (nextValue) => {
    if (typeof nextValue !== 'undefined') {
      initialSerialized.current = stableStringify(nextValue);
      setValue(nextValue);
      localStorage.setItem(storageKey, stableStringify(nextValue));
      return;
    }

    initialSerialized.current = serialized;
  };

  return {
    value,
    setValue,
    isDirty,
    clearDraft,
    markClean
  };
};

export default useFormDraft;
