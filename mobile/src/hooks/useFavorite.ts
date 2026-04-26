import { useState, useCallback } from 'react';

export function useFavorite(initialState = false) {
  const [isFavorited, setIsFavorited] = useState(initialState);

  const toggle = useCallback(() => {
    setIsFavorited((prev) => !prev);
  }, []);

  return { isFavorited, toggle };
}
