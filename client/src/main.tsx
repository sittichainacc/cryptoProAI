import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Apply saved theme immediately to prevent flash
const savedTheme = localStorage.getItem('cryptopro-theme');
if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

