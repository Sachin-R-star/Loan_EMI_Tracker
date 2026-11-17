import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { handleMockApi } from './services/mockBackend.js';
import './index.css';

// Transparent fetch interceptor:
// When deployed on Vercel as a frontend-only project (Root Directory: client),
// there is no Express server at /api. All /api/* calls are intercepted directly
// by the in-browser mock engine with localStorage persistence.
// On localhost, it attempts the real backend first and falls back if unavailable.
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input ? input.url : '');

  if (url && (url.startsWith('/api') || url.includes('/api/'))) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // On Vercel / static hosting, intercept immediately without making failed HTTP network requests
    if (!isLocalhost) {
      const mockRes = await handleMockApi(url, init);
      if (mockRes.isBlob) {
        return new Response(new Blob([mockRes.data], { type: 'text/csv' }), {
          status: mockRes.status,
          headers: { 'Content-Type': 'text/csv' }
        });
      }
      return new Response(JSON.stringify(mockRes.data), {
        status: mockRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // On localhost, try connecting to the Express server
    try {
      const response = await originalFetch(input, init);
      const contentType = response.headers.get('content-type') || '';
      const isHtmlResponse = contentType.includes('text/html');

      // If backend returned HTML (e.g. 404 / 405 page) instead of JSON API response
      if (!response.ok && isHtmlResponse || response.status === 404 || response.status === 405 || isHtmlResponse) {
        const mockRes = await handleMockApi(url, init);
        if (mockRes.isBlob) {
          return new Response(new Blob([mockRes.data], { type: 'text/csv' }), {
            status: mockRes.status,
            headers: { 'Content-Type': 'text/csv' }
          });
        }
        return new Response(JSON.stringify(mockRes.data), {
          status: mockRes.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return response;
    } catch (netErr) {
      // Backend not running on localhost -> fallback to mock engine
      const mockRes = await handleMockApi(url, init);
      if (mockRes.isBlob) {
        return new Response(new Blob([mockRes.data], { type: 'text/csv' }), {
          status: mockRes.status,
          headers: { 'Content-Type': 'text/csv' }
        });
      }
      return new Response(JSON.stringify(mockRes.data), {
        status: mockRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
