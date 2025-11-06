import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Service Worker update handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      // Reload the page to get the latest version
      window.location.reload();
    }
  });

  // Check for updates every 5 minutes
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) reg.update();
    });
  }, 5 * 60 * 1000);
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
