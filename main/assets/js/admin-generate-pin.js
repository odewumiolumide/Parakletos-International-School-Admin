import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const app = initializeApp({
  apiKey: "AIzaSyBqBTuNUD2pf2XUVnhKH9t7PyVSmQtD4c4",
  databaseURL: "https://parakletos-result-default-rtdb.firebaseio.com"
});

const db = getDatabase(app);

window.generatePin = async function () {
  const cls = document.getElementById("class").value.trim();
  const term = document.getElementById("term").value;

  if (!cls) {
    alert("Enter a Class to Generate a PIN");
    return;
  }

  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  await set(ref(db, `ClassPins/${term}/${cls}`), {
    pin,
    createdAt: Date.now()
  });

  const output = document.getElementById("output");
  output.style.display = "block";
  output.innerHTML = `
    PINs generated for <strong>${cls}</strong> (${term})
    <div class="pin">${pin}</div>
  `;
};

// Make navigation functions global
window.goDashboard = function() {
  window.location.href = "admin-dashboard.html";
}

window.viewPins = function() {
  window.location.href = "class-pins-table.html";
}