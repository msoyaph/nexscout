import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Add error handling for rendering
try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('[main.tsx] App rendered successfully');
} catch (error) {
  console.error('[main.tsx] Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: white; padding: 2rem;">
      <div style="text-align: center; max-width: 500px;">
        <h1 style="color: #dc2626; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Failed to Load App</h1>
        <p style="color: #4b5563; margin-bottom: 1rem;">${error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
