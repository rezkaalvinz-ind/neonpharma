import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: '20px',
            fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
            border: 'none',
            boxShadow: '12px 12px 24px rgba(174,164,204,0.25)',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
