import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { handleMockApi } from './services/mockBackend.js';
import './index.css';

// Transparent fetch interceptor:
// If the app is deployed on Vercel without a backend server, requests to /api/* 
// return 404. This interceptor seamlessly switches to the in-browser mock engine
// with localStorage persistence, guaranteeing 100% functionality on static cloud hosts.
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input ? input.url : '');

  if (url && (url.startsWith('/api') || url.includes('/api/'))) {
    try {
      const response = await originalFetch(input, init);
      // Check if backend actually handled it or returned a 404 HTML fallback
      const contentType = response.headers.get('content-type') || '';
      const isHtml404 = response.status === 404 || (response.status === 200 && contentType.includes('text/html'));

      if (isHtml404) {
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
