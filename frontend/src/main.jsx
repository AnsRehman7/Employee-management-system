import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FirebaseProvider } from './context/firebase.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { registerNotificationWorker } from './utils/browserNotifications.js'

registerNotificationWorker().catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <FirebaseProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </FirebaseProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
