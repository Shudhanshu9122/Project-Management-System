import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads a resource on mount and whenever `deps` change.
 *
 * Pull-to-refresh reuses the same loader but keeps whatever is already on
 * screen, so a refresh does not replace the list with a spinner. The loader sits
 * in a ref so an inline arrow function does not retrigger the effect.
 */
export function useResource(loader, deps = []) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: true,
    refreshing: false,
  });

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async ({ refresh = false } = {}) => {
    setState((current) => ({
      ...current,
      loading: refresh ? false : current.data === null,
      refreshing: refresh,
      error: null,
    }));

    try {
      const data = await loaderRef.current();
      setState({ data, error: null, loading: false, refreshing: false });
    } catch (error) {
      // Existing data is kept on failure so a dropped connection does not wipe
      // the screen; the banner explains what happened.
      setState((current) => ({
        data: current.data,
        error,
        loading: false,
        refreshing: false,
      }));
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    reload: useCallback(() => run(), [run]),
    refresh: useCallback(() => run({ refresh: true }), [run]),
    setData: useCallback((data) => setState({ data, error: null, loading: false, refreshing: false }), []),
  };
}
