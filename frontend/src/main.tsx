import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App'

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
      appearance={{
        variables: {
          colorPrimary: '#0c4a6e',
          colorText: '#082f49',
          colorTextSecondary: '#94c4e0',
          colorInputBackground: '#0a3d5c',
          colorInputText: '#fde68a',
          fontFamily: 'Zain, sans-serif',
          fontSize: '1rem',
          borderRadius: '0.375rem',
        },
        elements: {
          card: {
            backgroundColor: '#f5c842',
          },
          socialButtonsBlockButton: {
            backgroundColor: '#ffffff',
            color: '#3c4043',
            border: '1px solid #dadce0',
          },
          socialButtonsBlockButtonText: {
            color: '#3c4043',
            fontWeight: '500',
          },
          headerTitle: {
            fontSize: '1.4rem',
            fontWeight: '800',
            color: '#082f49',
          },
          headerSubtitle: {
            color: '#082f49',
          },
          formFieldInput: {
            backgroundColor: '#fef9e7', // very light warm white, not stark white
            color: '#082f49',
            border: '1px solid #0c4a6e',
          },
          formFieldLabel: {
            color: '#082f49',
            fontWeight: '600',
          },
          dividerText: {
            color: '#082f49',
          },
          dividerLine: {
            backgroundColor: '#0c4a6e',
            opacity: '0.2',
          },
          lastAuthenticationStrategyBadge: {
            backgroundColor: '#e8b832',
            color: '#082f49',
            border: 'none',
            boxShadow: 'none',
            padding: '0 8px',
          },
          userButtonPopoverCard: {
            backgroundColor: '#fef9e7 !important',
            border: '1px solid #0c4a6e',
          },
          userButtonPopoverActionButton: {
            color: '#082f49',
          },
          userButtonPopoverActionButtonText: {
            color: '#082f49',
            fontSize: '1rem',
          },
          userButtonPopoverActionButtonIcon: {
            color: '#082f49',
          },
          userButtonPopoverFooter: {
            display: 'none', // hide the "Secured by Clerk" footer
          },
          userPreviewMainIdentifier: {
            color: '#082f49',
            fontSize: '1rem',
          },
          userPreviewSecondaryIdentifier: {
            color: '#0c4a6e',
          },
        },
      }}
    >
      <Router>
        <App />
      </Router>
    </ClerkProvider>
  </StrictMode>
)
