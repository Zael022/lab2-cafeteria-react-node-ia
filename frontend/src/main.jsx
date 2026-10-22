import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AvisosProvider } from './components/Avisos.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter: permite cambiar de vista sin recargar la página */}
    <BrowserRouter>
      {/* AvisosProvider: los mensajes flotantes ("Producto guardado") */}
      <AvisosProvider>
        <App />
      </AvisosProvider>
    </BrowserRouter>
  </StrictMode>
);
