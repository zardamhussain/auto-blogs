import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProjectProvider } from './context/ProjectContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProjectProvider>
            <ToastProvider>
              <TaskProvider>
                <App />
              </TaskProvider>
            </ToastProvider>
          </ProjectProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
)
