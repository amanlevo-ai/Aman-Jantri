// Firebase Project Configuration
// You can either put your Firebase credentials in a .env file or paste them directly below.

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDDUlYBUMe8k9tMDYMtc9nBPn1nkNZEzTs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aman-jantri.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aman-jantri",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aman-jantri.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1071933340087",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1071933340087:web:e42a911889f7fd081d5032",
};

export function isFirebaseConfigured(): boolean {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    Boolean(firebaseConfig.projectId) &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}
