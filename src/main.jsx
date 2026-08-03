// main.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import store from './redux/store.js';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import BottomNav from './components/ui/bottom-nav'; // Import BottomNav


const root = ReactDOM.createRoot(document.getElementById('root'));

// Automatically reload the page if a dynamically imported module fails to load
// This typically happens when a new version is deployed and the user's browser
// is trying to load an old chunk that no longer exists on the server.
window.addEventListener('vite:preloadError', (event) => {
  console.warn('vite:preloadError detected, reloading the page...', event);
  window.location.reload();
});

root.render(
  <Provider store={store}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>

      {/* <React.StrictMode> */}
      <App />
      {/* </React.StrictMode> */}
    </BrowserRouter>
  </Provider>
);
