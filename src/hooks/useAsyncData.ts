import { useState, useEffect, use } from 'react';

// React 19 compatible async data hook using the new use() hook
export function useAsyncData<T>(promise: Promise<T> | null): {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPromise, setCurrentPromise] = useState<Promise<T> | null>(promise);

  const refetch = () => {
    if (promise) {
      setCurrentPromise(Promise.resolve().then(() => promise));
    }
  };

  useEffect(() => {
    if (!currentPromise) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    currentPromise
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPromise]);

  return { data, error, loading, refetch };
}

// React 19 use() hook wrapper for promises
export function useSuspenseData<T>(promise: Promise<T>): T {
  // This will suspend the component until the promise resolves
  // React 19's use() hook handles the promise suspension automatically
  return use(promise);
}

// Enhanced async hook with React 19 concurrent features
export function useConcurrentAsyncData<T>(
  promiseFactory: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = () => {
    setLoading(true);
    setError(null);
    
    promiseFactory()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    refetch();
  }, deps);

  return { data, error, loading, refetch };
}