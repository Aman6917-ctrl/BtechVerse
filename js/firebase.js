// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
// import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Helper function to get environment variables
// function getEnvVar(name) {
//     // Check for meta tags first (injected by server)
//     const metaTag = document.querySelector(`meta[name="env-${name}"]`);
//     if (metaTag) {
//         const value = metaTag.getAttribute('content');
//         if (value && value.trim()) {
//             return value.trim();
//         }
//     }
    
//     // Fallback: try to get from global window object (if available)
//     if (typeof window !== 'undefined' && window.ENV && window.ENV[name]) {
//         return window.ENV[name];
//     }
    
//     // If no environment variable found, show error
//     console.error(`Missing Firebase configuration: ${name}`);
//     return null;
// }

// Get Firebase configuration from environment
// const apiKey = getEnvVar('FIREBASE_API_KEY');
// const projectId = 'btechverse-c469b';
// const appId = '1:145554824271:web:345ce29491d664e1d29e3a';

// // Validate that we have the required configuration
// if (!apiKey || !projectId || !appId) {
//     console.error('Missing required Firebase configuration. Please check your environment variables.');
//     // Show user-friendly error
//     document.addEventListener('DOMContentLoaded', function() {
//         const body = document.body;
//         const errorDiv = document.createElement('div');
//         errorDiv.className = 'fixed inset-0 bg-red-600 text-white flex items-center justify-center z-50';
//         errorDiv.innerHTML = `
//             <div class="text-center p-8 max-w-md">
//                 <i class="fas fa-exclamation-triangle text-6xl mb-4"></i>
//                 <h2 class="text-2xl font-bold mb-4">Configuration Error</h2>
//                 <p class="mb-4">Firebase configuration is missing. Please check that your environment variables are set correctly.</p>
//                 <p class="text-sm opacity-80">Required: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID</p>
//             </div>
//         `;
//         body.appendChild(errorDiv);
//     });
//     throw new Error('Firebase configuration missing');
// }

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfXDF2MOkPXudbI10oKeOYugDz3GwREa4",
  authDomain: "btechverse-c469b.firebaseapp.com",
  projectId: "btechverse-c469b",
  storageBucket: "btechverse-c469b.firebasestorage.app",
  messagingSenderId: "145554824271",
  appId: "1:145554824271:web:345ce29491d664e1d29e3a",
  measurementId: "G-J5QR75LQ7J"
};


// Debug: Log configuration (without sensitive data)
// console.log('Firebase Config:', {
//     projectId: projectId,
//     authDomain: `${projectId}.firebaseapp.com`,
//     hasApiKey: !!apiKey,
//     hasAppId: !!appId
// });

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app);

// Export the app instance
export default app;

// Test Firebase connection
auth.onAuthStateChanged((user) => {
    console.log('Firebase Auth State Changed:', user ? 'User logged in' : 'User logged out');
});

console.log('Firebase initialized successfully');
