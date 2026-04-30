import { useMemo } from 'react';
import type { WebviewRequest } from '../types';

interface VsCodeApi {
  postMessage(message: WebviewRequest): void;
  getState<T = unknown>(): T | undefined;
  setState<T = unknown>(state: T): void;
}

// Singleton — acquireVsCodeApi() may only be called once per webview.
// All callers share this instance instead of calling acquireVsCodeApi() independently.
export const vscodeApi: VsCodeApi | undefined = window.acquireVsCodeApi?.();

export function useVsCodeApi(): VsCodeApi {
  return useMemo(() => {
    if (!vscodeApi) {
      throw new Error('VS Code API not available');
    }
    return vscodeApi;
  }, []);
}
