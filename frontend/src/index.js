import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { startKeepAlive } from './services/keepAlive';

// Start backend keep-alive pings to prevent Render cold starts
startKeepAlive();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);