import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  let isRefreshing = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (isRefreshing) {
      return
    }

    isRefreshing = true
    window.location.reload()
  })
}

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
