import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { installMockApiServer, resetMockApiServer } from './mockApiServer';

// dnd-kit measures elements with ResizeObserver, which jsdom doesn't
// implement. A no-op polyfill is enough since tests don't assert on
// actual measured sizes.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}

// Stub `fetch` with an in-memory fake of the FastAPI backend so tests never
// hit the network — see mockApiServer.ts. Tests that mock `../api/backend`
// directly (e.g. useBoard.test.tsx) never reach this.
beforeEach(() => {
  installMockApiServer();
  resetMockApiServer();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
