import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DB } from './lib/db';

// Initialize DB migration
DB.init().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
