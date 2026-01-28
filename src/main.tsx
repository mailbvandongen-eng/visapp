import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { version } from '../package.json'
import { useGooglePhotosStore } from './store/googlePhotosStore'

console.log(`%c🐟 VisApp v${version}`, 'background: #2196F3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;')

// Handle Google Photos OAuth callback
if (window.location.hash.includes('access_token')) {
  const handled = useGooglePhotosStore.getState().handleAuthCallback()
  if (handled) {
    console.log('%c📸 Google Photos authenticated', 'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 4px;')
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
