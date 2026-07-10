import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import axios from 'axios'
import { API_BASE_URL } from './config'

// Setup global Axios base URL redirection to support environment variables from .env
axios.defaults.baseURL = API_BASE_URL;

axios.interceptors.request.use((config) => {
  const envUrl = API_BASE_URL;
  if (envUrl && config.url && config.url.startsWith('http://localhost:8000')) {
    config.url = config.url.replace('http://localhost:8000', envUrl);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

