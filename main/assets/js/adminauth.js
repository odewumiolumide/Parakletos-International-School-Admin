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

// ----------------- PAGE & AUTO LOGOUT -----------------
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes
let inactivityTimer;

// ----------------- AUTO LOGOUT FUNCTION -----------------
const autoLogout = async (reason = "inactivity") => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout failed:", err);
  }

  sessionStorage.removeItem("adminLoggedIn");

  // Mark manual logout so it won't trigger auto-logout alert again
  if (reason === "manual") {
    sessionStorage.setItem("manualLogout", "true");
  }

  if (reason === "inactivity") {
    alert("You have been logged out due to inactivity.");
  }

  window.location.href = "index.html";
};

// ----------------- RESET INACTIVITY TIMER -----------------
const resetTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => autoLogout("inactivity"), AUTO_LOGOUT_TIME);
};

// ----------------- PROTECT DASHBOARD PAGES -----------------
if (currentPage !== "index.html" && currentPage !== "") {
  // Monitor auth state
  onAuthStateChanged(auth, (user) => {
    // Only auto-logout if user is not logged in and not manual logout
    if (!user && !sessionStorage.getItem("manualLogout")) {
      autoLogout("inactivity");
    }

    // Clear manual logout flag on page load
    sessionStorage.removeItem("manualLogout");
  });

  // Reset inactivity timer on user activity
  ["mousemove", "keydown", "click", "scroll"].forEach(evt =>
    document.addEventListener(evt, resetTimer)
  );
  window.addEventListener("load", resetTimer);
}

// ----------------- LOGOUT BUTTON -----------------
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await autoLogout("manual"); // trigger manual logout
      alert("You have successfully logged out.");
    });
  }
});
