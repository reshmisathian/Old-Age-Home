import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { AppThemeProvider } from './ThemeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppThemeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </AppThemeProvider>
  </StrictMode>
);
