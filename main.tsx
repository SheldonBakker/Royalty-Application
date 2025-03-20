import { createRoot, Root } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Component, ErrorInfo, ReactNode } from 'react'
import { DarkModeProvider } from './contexts/DarkModeContext'
import './index.css'
import App from './App.tsx'

// ... existing ErrorBoundary class ...

// Render the app using the stored root
const renderApp = () => {
  if (window.__REACT_ROOT) {
    window.__REACT_ROOT.render(
      <ErrorBoundary>
        <DarkModeProvider>
          <HashRouter basename="/">
            <App />
          </HashRouter>
        </DarkModeProvider>
      </ErrorBoundary>
    )
  }
}

// ... rest of the existing code ... 