import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuration ---
const firebaseConfig = JSON.parse(window.__firebase_config || '{}');

try {
    // --- Init Services ---
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Expose services to global scope for the main script to use
    window.firebaseServices = {
        auth, db,
        signInAnonymously, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
        collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp
    };

    console.log("Firebase Loaded Successfully");

    // Attach Real Auth Listeners if AuthManager is ready
    onAuthStateChanged(auth, (user) => {
        console.log("Firebase Auth State:", user ? "Logged In" : "Logged Out");

        // If AuthManager is defined, let it handle the user state
        if (typeof AuthManager !== 'undefined') {
            AuthManager.handleUser(user);
        }
    });

    // Re-bind Guest Login to actual Firebase Anon Login if available
    // REMOVED: Causing conflict with AuthManager. We will use AuthManager's mock login for Guest.
    /*
    const guestBtn = document.getElementById('btn-guest-login');
    if (guestBtn) {
        guestBtn.onclick = () => {
             // ...
        };
    }
    */

} catch (e) {
    console.warn("Firebase Module failed to initialize (likely due to file:// protocol or offline). App running in Local Mode.");
}
