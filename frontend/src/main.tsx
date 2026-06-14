import { StrictMode } from 'react'
import { ClerkProvider } from '@clerk/react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'

import App from './App'
import { clerkAppearance, clerkLocalization } from './clerkConfig'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing Clerk publishable key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={clerkAppearance}
      localization={clerkLocalization}
    >
      <Router>
        <App />
      </Router>
    </ClerkProvider>
  </StrictMode>
)
