import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Root } from '@stratakit/mui';
import App from './App.jsx';
import './App.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root colorScheme="dark" className="app-root">
      <App />
    </Root>
  </StrictMode>,
);
