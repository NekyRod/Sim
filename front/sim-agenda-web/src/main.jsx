import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/estilos.css';   // <-- aquí

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
