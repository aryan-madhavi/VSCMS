import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Bootstrap 5 CSS & Icons & JS Bundle
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
