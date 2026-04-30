import { useMemo } from 'react';
import type { WebviewRequest } from '../types';

interface VsCodeApi {
  postMessage(message: WebviewRequest): void;
  getState<T = unknown>(): T | undefined;
  setState<T = unknown>(state: T): void;
}

export function useVsCodeApi(): VsCodeApi {
  return useMemo(() => {
    const api = window.acquireVsCodeApi?.();
    if (!api) {
      throw new Error('VS Code API not available');
    }
    return api;
  }, []);
}
