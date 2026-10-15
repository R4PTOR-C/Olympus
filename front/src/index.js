import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import './index.css';
import { instalarInterceptorApi } from './services/api';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Precisa vir antes de qualquer fetch: injeta o token nas chamadas à API
instalarInterceptorApi();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// PWA só no navegador. No app nativo os arquivos já vêm do APK; um service
// worker ali só serviria versões antigas do cache depois de um update.
if (Capacitor.isNativePlatform()) {
    serviceWorkerRegistration.unregister();
} else {
    serviceWorkerRegistration.register();
}

reportWebVitals();
