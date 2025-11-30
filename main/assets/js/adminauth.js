import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCI7CJ1xb6q2Rll-3AxikmYGrNO1buL4vQ",
  authDomain: "parakletos-database.firebaseapp.com",
  projectId: "parakletos-database",
  storageBucket: "parakletos-database.firebasestorage.app",
  messagingSenderId: "613062536180",
  appId: "1:613062536180:web:08acb8be09ff66645d67a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ----------------- PROTECT ADMIN PAGE -----------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    sessionStorage.removeItem("adminLoggedIn");
    window.location.href = "index.html";
  }
});

// ----------------- LOGOUT FUNCTION -----------------
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      sessionStorage.removeItem("adminLoggedIn");
      window.location.href = "index.html";
    });
  }
});
