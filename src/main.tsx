import './utils/deskTheme';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DeskErrorBoundary } from './components/DeskErrorBoundary';
import './index.css';

document.title = 'Chronicle Cryptogram';

function registerPressWorker() {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW();
  });
}

if (document.readyState === 'complete') {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(registerPressWorker, { timeout: 2500 });
  } else {
    registerPressWorker();
  }
} else {
  window.addEventListener(
    'load',
    () => {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(registerPressWorker, { timeout: 2500 });
      } else {
        registerPressWorker();
      }
    },
    { once: true }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeskErrorBoundary>
      <App />
    </DeskErrorBoundary>
  </StrictMode>,
);
