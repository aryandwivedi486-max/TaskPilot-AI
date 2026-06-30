import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully suppress browser extension errors that fail inside sandboxed preview iframes
window.addEventListener('error', (event) => {
  const message = event.message || (event.error && event.error.message) || '';
  const filename = event.filename || '';
  const stack = event.error?.stack || '';
  
  const isExtensionError = 
    message.includes('This script should only be loaded in a browser extension') ||
    filename.includes('chrome-extension://') ||
    stack.includes('chrome-extension://');
    
  if (isExtensionError) {
    console.warn('[TaskPilot AI] Safely suppressed a browser extension exception:', message);
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = (reason instanceof Error && reason.stack) ? reason.stack : '';
  
  const isExtensionError = 
    message.includes('This script should only be loaded in a browser extension') ||
    stack.includes('chrome-extension://');
    
  if (isExtensionError) {
    console.warn('[TaskPilot AI] Safely suppressed a browser extension promise rejection:', message);
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for offline PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[TaskPilot AI] ServiceWorker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('[TaskPilot AI] ServiceWorker registration failed:', err);
      });
  });
}


