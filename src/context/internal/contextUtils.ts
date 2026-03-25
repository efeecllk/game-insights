import { createContext, useContext } from 'react';

export function createRequiredContext<T>(hookName: string, providerName: string) {
  const Context = createContext<T | undefined>(undefined);

  function useRequiredContext() {
    const value = useContext(Context);
    if (value === undefined) {
      throw new Error(`${hookName} must be used within ${providerName}`);
    }
    return value;
  }

  return [Context, useRequiredContext] as const;
}

export function selectMostRecentBy<T>(
  items: T[],
  getTimestamp: (item: T) => string,
): T | null {
  if (items.length === 0) {
    return null;
  }

  return [...items].sort(
    (a, b) => new Date(getTimestamp(b)).getTime() - new Date(getTimestamp(a)).getTime(),
  )[0] ?? null;
}

export function firstOrNull<T>(items: T[]): T | null {
  return items[0] ?? null;
}
