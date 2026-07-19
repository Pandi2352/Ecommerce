import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted Inter (variable) — the project's UI typeface. No external CDN call.
import '@fontsource-variable/inter';
import { App } from './app/App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
