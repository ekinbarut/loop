import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ColorAdmin } from './components/ColorAdmin.jsx';
import { MemoryGate } from './components/MemoryGate.jsx';
import './App.css';

const isAdmin = window.location.pathname.replace(/\/+$/, '').endsWith('/asli');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <MemoryGate><ColorAdmin /></MemoryGate> : <App />}
  </StrictMode>,
);
