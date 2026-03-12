import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AudioControlProvider } from './AudioControlContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AudioControlProvider>
      <App />
    </AudioControlProvider>
  </StrictMode>,
)
