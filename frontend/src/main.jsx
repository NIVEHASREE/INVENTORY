import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/common.css";
import "./styles/dashboard.css";
import "./styles/inventory.css";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
