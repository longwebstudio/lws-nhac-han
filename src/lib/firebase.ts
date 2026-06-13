import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";

// Your web app's Firebase configuration (provided by user for gvc-task)
const firebaseConfig = {
  apiKey: "AIzaSyDraj3RaCTiGTK_Alsbslb-kbelw9Iyhgw",
  authDomain: "gvc-task.firebaseapp.com",
  databaseURL: "https://gvc-task-default-rtdb.firebaseio.com",
  projectId: "gvc-task",
  storageBucket: "gvc-task.firebasestorage.app",
  messagingSenderId: "194642192267",
  appId: "1:194642192267:web:66bedc6e262d9fce83318e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standardize Google credential mapping
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Handle Google Firebase Sign-In and retrieve authenticated user
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}
