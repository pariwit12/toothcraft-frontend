import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';

// สำหรับ PWA
// ✅ เพิ่ม import สำหรับ Service Worker
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// สำหรับ PWA
// ✅ Register Service Worker (online-first)
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // แจ้งผู้ใช้ว่าแอปมีเวอร์ชันใหม่
    if (window.confirm("มีเวอร์ชันใหม่ของแอป ต้องการโหลดใหม่หรือไม่?")) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    }
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
