// ----------------- IMPORTS -----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ----------------- FIREBASE CONFIG -----------------
const firebaseConfig = {
  apiKey: "AIzaSyCI7CJ1xb6q2Rll-3AxikmYGrNO1buL4vQ",
  authDomain: "parakletos-database.firebaseapp.com",
  projectId: "parakletos-database",
  storageBucket: "parakletos-database.firebasestorage.app",
  messagingSenderId: "613062536180",
  appId: "1:613062536180:web:08acb8be09ff66645d67a1"
};

// ----------------- INITIALIZE -----------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ================= ELEMENTS =================
const loginForm = document.getElementById("loginForm");
const modal = document.getElementById("errorModal");
const closeModal = document.getElementById("closeModal");
const modalMessage = document.getElementById("modalMessage");
const loginBtn = document.getElementById("loginBtn");

let failedAttempts = 0;
const MAX_ATTEMPTS = 10;

// Success message element
const successBox = document.createElement("p");
successBox.style.color = "green";
successBox.style.textAlign = "center";
successBox.style.fontWeight = "600";
successBox.style.marginTop = "15px";
successBox.style.display = "none";
successBox.textContent = "Login successful!";


const loginSection = document.querySelector(".login-section");
if (loginSection) {
  loginSection.appendChild(successBox);
};


// ================= LOGIN =================
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
      // Attempt login
      await signInWithEmailAndPassword(auth, email, password);

      failedAttempts = 0;
      successBox.style.display = "block";

      // Redirect to dashboard
      setTimeout(() => {
        window.location.replace("admin-dashboard.html");
      }, 1200);

    } catch (error) {
      failedAttempts++;
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";

      // Show error modal
      modalMessage.textContent = `${error.message} (${failedAttempts}/${MAX_ATTEMPTS})`;
      modal.style.display = "flex";

      if (failedAttempts >= MAX_ATTEMPTS) {
        alert("Too many failed login attempts! Try again in 5 minutes.");
        loginBtn.disabled = true;
        setTimeout(() => { 
          loginBtn.disabled = false; 
          failedAttempts = 0; 
        }, 5 * 60 * 1000); // 5 min lockout
      }
    }
  });
}

// ================= CLOSE MODAL =================
if (closeModal) {
  closeModal.addEventListener("click", () => modal.style.display = "none");
}
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// ================= REDIRECT LOGGED-IN USERS =================
onAuthStateChanged(auth, (user) => {
  const page = window.location.pathname.split("/").pop().toLowerCase();
  if (user && page === "index.html") {
    window.location.replace("admin-dashboard.html");
  }
});

// ================= INACTIVITY AUTO-LOGOUT =================
const AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 min
let inactivityTimer;

const autoLogout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout failed:", err);
  }
  alert("You have been logged out due to inactivity.");
  window.location.replace("index.html");
};

const resetTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(autoLogout, AUTO_LOGOUT_TIME);
};

// Reset inactivity timer on user activity
["click", "mousemove", "keydown", "scroll"].forEach(evt =>
  document.addEventListener(evt, resetTimer)
);
window.addEventListener("load", resetTimer);
