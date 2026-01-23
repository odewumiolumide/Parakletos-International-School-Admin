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

// ================= PROTECTED PAGES =================
const PROTECTED_PAGES = [
  "admin-dashboard.html",
  "broadsheet.html",
  "result-add.html",
  "result-preview.html",
  "result-edit.html",
  "result-list.html",
  "staff-role.html",
  "student-add.html",
  "student-list.html",
  "view-profile.html"
];

// ================= CURRENT PAGE =================
const currentPage = window.location.pathname.split("/").pop().toLowerCase();

// ================= CHECK AUTH =================
if (PROTECTED_PAGES.includes(currentPage)) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Not logged in → redirect immediately
      alert("You must login correctly to access this page!");
      window.location.replace("index.html");
    } else {
      // Mark user as logged in (session flag)
      sessionStorage.setItem("adminLoggedIn", "true");
    }
  });
}

// ================= AUTO-LOGOUT ON INACTIVITY =================
const AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes
let inactivityTimer;

const autoLogout = async (reason = "inactivity") => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout failed:", err);
  }

  sessionStorage.removeItem("adminLoggedIn");

  if (reason === "inactivity") alert("You have been logged out due to inactivity.");

  window.location.replace("index.html");
};

// Reset inactivity timer
const resetTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => autoLogout("inactivity"), AUTO_LOGOUT_TIME);
};

// Listen to user activity
["click", "mousemove", "keydown", "scroll"].forEach(evt => 
  document.addEventListener(evt, resetTimer)
);
window.addEventListener("load", resetTimer);

// ================= LOGOUT BUTTON =================
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await autoLogout("manual");
      alert("You have successfully logged out.");
    });
  }
});
