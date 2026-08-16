/**
 * Firebase Auth & Cloud Firestore Realtime Sync Module
 * Provides secure Google Sign-In and private user document synchronization.
 */

const firebaseConfig = {
  apiKey: "AIzaSyCwnnNS-Xsfs8WbcIuGWiGaA6rIOQs0EgE",
  authDomain: "financehub-2a52f.firebaseapp.com",
  projectId: "financehub-2a52f",
  storageBucket: "financehub-2a52f.firebasestorage.app",
  messagingSenderId: "54589386562",
  appId: "1:54589386562:web:a5d3372237f00e4005a2db",
  measurementId: "G-SBDT782TNQ",
};

let currentUser = null;
let authInstance = null;
let dbInstance = null;
let googleProvider = null;

export function getCurrentUser() {
  return currentUser;
}

export async function initFirebase(onStateSynced, onAuthChanged, showToast) {
  try {
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
    );
    const {
      getAuth,
      signInWithPopup,
      GoogleAuthProvider,
      signOut,
      onAuthStateChanged,
    } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
    );
    const {
      getFirestore,
      doc,
      setDoc,
      getDoc,
    } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );

    const app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });

    onAuthStateChanged(authInstance, async (user) => {
      currentUser = user;
      if (typeof onAuthChanged === "function") {
        onAuthChanged(user);
      }

      if (user) {
        if (showToast) {
          const name = user.displayName ? user.displayName.split(" ")[0] : "User";
          showToast(`Connected as ${name}. Syncing cloud data...`);
        }

        try {
          const docRef = doc(dbInstance, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists() && docSnap.data().appData) {
            const cloudData = docSnap.data().appData;
            if (typeof onStateSynced === "function") {
              onStateSynced(cloudData);
            }
            if (showToast) showToast("Cloud workspace synced securely.");
          } else {
            // First time login - upload existing local workspace
            if (typeof onStateSynced === "function") {
              const localState = onStateSynced(null);
              if (localState) {
                await setDoc(docRef, { appData: localState, updatedAt: Date.now() }, { merge: true });
              }
            }
          }
        } catch (err) {
          console.error("Cloud data pull error:", err);
          if (showToast) showToast("Cloud sync failed. Operating in local mode.", true);
        }
      }
    });

    return {
      login: async () => {
        try {
          await signInWithPopup(authInstance, googleProvider);
        } catch (err) {
          console.error("Authentication error:", err);
          if (err.code !== "auth/popup-closed-by-user" && showToast) {
            showToast("Sign in unsuccessful. Please try again.", true);
          }
        }
      },
      logout: async () => {
        try {
          await signOut(authInstance);
          currentUser = null;
          if (showToast) showToast("Signed out securely.");
        } catch (err) {
          console.error("Sign out error:", err);
          if (showToast) showToast("Sign out encountered an issue.", true);
        }
      },
      saveToCloud: async (data) => {
        if (!currentUser || !dbInstance) return;
        try {
          const docRef = doc(dbInstance, "users", currentUser.uid);
          await setDoc(docRef, { appData: data, updatedAt: Date.now() }, { merge: true });
        } catch (err) {
          console.error("Cloud sync save error:", err);
        }
      },
    };
  } catch (error) {
    console.warn("Firebase unavailable (running in local offline mode):", error);
    return null;
  }
}
