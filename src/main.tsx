import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { version } from '../package.json'

console.log(`%c🐟 VisApp v${version}`, 'background: #2196F3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
