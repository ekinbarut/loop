import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ColorAdmin } from './components/ColorAdmin.jsx';
import './App.css';

const isAdmin = window.location.pathname.replace(/\/+$/, '').endsWith('/root/asli');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <ColorAdmin /> : <App />}
  </StrictMode>,
);
