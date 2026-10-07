import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `loader` whenever `deps` change, cancelling the in-flight request when a
 * new one starts or the component unmounts.
 *
 * The loader is kept in a ref so an inline arrow function does not restart the
 * request on every render; only `deps` decide when to fetch.
 */
export function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((previous) => ({ ...previous, loading: true, error: null }));

    loaderRef.current(controller.signal)
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!active || error.name === 'AbortError') return;
        setState({ data: null, error, loading: false });
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, reload, setData: (data) => setState({ data, error: null, loading: false }) };
}
