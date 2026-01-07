import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// 1. IMPORTAR ESTO:
import { BrowserRouter } from 'react-router-dom' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. ENVOLVER APP AQUÍ */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)