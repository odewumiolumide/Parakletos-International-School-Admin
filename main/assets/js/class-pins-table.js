import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const app = initializeApp({
  apiKey: "AIzaSyBqBTuNUD2pf2XUVnhKH9t7PyVSmQtD4c4",
  databaseURL: "https://parakletos-result-default-rtdb.firebaseio.com"
});

const db = getDatabase(app);

// Generate PIN
window.generatePin = async function(){
  const cls = document.getElementById("class").value.trim();
  const term = document.getElementById("term").value;

  if(!cls) return alert("Enter class");

  const pin = Math.floor(100000 + Math.random()*900000).toString();

  await set(ref(db, `ClassPins/${term}/${cls}`), {
    pin,
    createdAt: Date.now()
  });

  const out = document.getElementById("output");
  out.innerHTML = `PIN for <strong>${cls}</strong> (${term}): <span class="pin">${pin}</span>`;
  loadPins();
};

// Load all pins
async function loadPins(){
  const tbody = document.getElementById("pinTable");
  tbody.innerHTML = "";

  const snap = await get(ref(db,"ClassPins"));
  if(!snap.exists()) {
    tbody.innerHTML = `<tr><td colspan="5">No PINs available</td></tr>`;
    return;
  }

  let index = 1;
  const data = snap.val();

  for(const term in data){
    for(const cls in data[term]){
      const p = data[term][cls];
      const date = new Date(p.createdAt).toLocaleString();

      tbody.innerHTML += `
        <tr>
          <td>${index++}</td>
          <td>${cls}</td>
          <td>${term}</td>
          <td class="pin">${p.pin}</td>
          <td>${date}</td>
        </tr>`;
    }
  }
}

loadPins();