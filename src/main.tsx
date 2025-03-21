import { createRoot, Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Component, ErrorInfo, ReactNode } from 'react'
import './index.css'
import App from './App.tsx'
import { disableDevTools } from './lib/disableDevTools'
import './lib/copyright.js'

// Initialize development tools configuration
disableDevTools();

// Error boundary to catch and handle asynchronous errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  // We need the error parameter for TypeScript, but don't use it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    
    // Handle specific message channel errors
    if (error.message?.includes('message channel closed before a response was received')) {
      console.log('Detected message channel error - will attempt recovery')
    }
  }
  
  // Allow retry to reload the application
  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Application Error</h2>
            <p className="text-gray-700 mb-4">
              The application encountered an unexpected error. This may be due to a network connection issue or message channel error.
            </p>
            <button
              onClick={this.handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Add global unhandled rejection handler to catch any promise errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  
  // Prevent the error from bubbling up if it's a message channel error
  if (event.reason?.message?.includes('message channel closed before a response was received')) {
    console.log('Intercepted message channel error - preventing crash')
    event.preventDefault()
  }
})

// Remove development-specific navigation monitoring
// if (!import.meta.env.PROD) {
//   window.addEventListener('hashchange', (event) => {
//     console.log('Navigation event (hash):', {
//       from: event.oldURL,
//       to: event.newURL
//     })
//   })
// }

// Prevent duplicate root creation
const rootElement = document.getElementById('root')

// Safely handle null check for root element
if (!rootElement) {
  throw new Error('Root element not found')
}

// Add a custom property to the window to track React root
interface CustomWindow extends Window {
  __REACT_ROOT?: Root
}

declare const window: CustomWindow

// Create root only once and store on window for reuse
if (!window.__REACT_ROOT) {
  window.__REACT_ROOT = createRoot(rootElement)
}

// Render the app using the stored root
const renderApp = () => {
  if (window.__REACT_ROOT) {
    window.__REACT_ROOT.render(
      <ErrorBoundary>
        <BrowserRouter future={{ 
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    )
  }
}

// Initial render
renderApp()

// Support hot module replacement for Vite
if (import.meta.hot) {
  import.meta.hot.accept('./App.tsx', () => {
    renderApp()
  })
}
