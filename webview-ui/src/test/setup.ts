/**
 * Vitest global setup for webview-ui tests.
 * Provides a minimal acquireVsCodeApi stub so imports of useVsCodeApi don't throw.
 */

import '@testing-library/jest-dom';

// Stub acquireVsCodeApi before any module imports it
const postMessageMock = vi.fn();

(window as unknown as Record<string, unknown>).acquireVsCodeApi = () => ({
  postMessage: postMessageMock,
  getState: vi.fn(),
  setState: vi.fn(),
});

// Expose the mock so tests can inspect/reset calls
(globalThis as unknown as Record<string, unknown>).__vscodePostMessage = postMessageMock;
