import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase Config
const firebaseConfig = {
 apiKey: "AIzaSyBPecwRMhqVlnf1bDXe553pcYVGm2TEEO0",
  authDomain: "parakletos-cbt-exam.firebaseapp.com",
  projectId: "parakletos-cbt-exam",
  databaseURL: "https://parakletos-cbt-exam-default-rtdb.firebaseio.com",
  storageBucket: "parakletos-cbt-exam.firebasestorage.app",
  messagingSenderId: "891853424979",
  appId: "1:891853424979:web:95af7a4822e9a6a42d39a6"
};

const app = !getApps().length
  ? initializeApp(firebaseConfig, "cbtExamApp")
  : getApp("cbtExamApp");

const db = getDatabase(app);

// Student & Exam
const studentId = sessionStorage.getItem("studentId");
const studentName = sessionStorage.getItem("studentName");
const examId = sessionStorage.getItem("examId");

const examContainer = document.getElementById("examQuestions");
const submitBtn = document.getElementById("submitExamBtn");
const timerDiv = document.getElementById("timer");
const questionNavDiv = document.getElementById("questionNav");
const progressDiv = document.getElementById("progressIndicator");

const EXAM_START = Date.now();

// BLOCK BACK BUTTON
history.pushState(null, null, location.href);
window.onpopstate = () => history.pushState(null, null, location.href);

// ENTRY
if (!studentId || !examId) {
  examContainer.innerHTML = "Invalid exam session.";
  submitBtn.disabled = true;
} else {
  checkExamCooldown().then(ok => ok && loadExam());
}

// COOLDOWN CHECK
async function checkExamCooldown() {
  const snap = await get(ref(db, `ExamAccess/${examId}/${studentId}`));
  if (!snap.exists()) return true;

  const data = snap.val();
  const now = Date.now();

  if (data.lastSubmitAt && now - data.lastSubmitAt < 5 * 60000) {
    alert("You can retake this exam after 5 minutes.");
    location.href = "exam-page.html";
    return false;
  }

  if (data.lastLogoutAt && now - data.lastLogoutAt < 60000) {
    alert("Please wait 1 minute before re-entering.");
    location.href = "exam-page.html";
    return false;
  }

  return true;
}

// LOAD EXAM
async function loadExam() {
  const qSnap = await get(ref(db, `Exam/${examId}/questions`));
  if (!qSnap.exists()) {
    examContainer.innerHTML = "No questions found.";
    return;
  }

  const questions = qSnap.val();
  const metaSnap = await get(ref(db, `Exam/${examId}/meta`));
  const duration = metaSnap.exists() ? parseInt(metaSnap.val().duration || 30) : 30;

  startTimer(duration * 60);

  questionNavDiv.innerHTML = "";
  examContainer.innerHTML = "";

  Object.entries(questions).forEach(([qId, q], idx) => {
    const nav = document.createElement("button");
    nav.textContent = idx + 1;
    nav.id = `nav_${qId}`;
    nav.onclick = () =>
      document.getElementById(`q_${qId}`).scrollIntoView({ behavior: "smooth" });
    questionNavDiv.appendChild(nav);

    const card = document.createElement("div");
    card.className = "question-card";
    card.id = `q_${qId}`;

    card.innerHTML = `
      <p><b>Q${idx + 1}:</b> ${q.question}</p>
      ${q.options.map((o, i) => `
        <label>
          <input type="radio" name="q_${qId}" value="${o}"> ${o}
        </label><br>
      `).join("")}
    `;

    card.querySelectorAll("input").forEach(inp =>
      inp.addEventListener("change", () => {
        nav.classList.add("answered");
        updateProgress();
      })
    );

    examContainer.appendChild(card);
  });

  updateProgress();
}

// TIMER
function startTimer(sec) {
  const t = setInterval(() => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    timerDiv.textContent = `Time Left: ${m}:${String(s).padStart(2, "0")}`;
    sec--;
    if (sec < 0) {
      clearInterval(t);
      autoSubmitExam();
    }
  }, 1000);
}

// PROGRESS
function updateProgress() {
  const total = document.querySelectorAll(".question-card").length;
  const answered = document.querySelectorAll("#questionNav .answered").length;
  progressDiv.textContent = `Answered ${answered} of ${total}`;
}

// SUBMIT
submitBtn.onclick = () =>
  new bootstrap.Modal(document.getElementById("confirmModal")).show();

document.getElementById("confirmSubmitBtn").onclick = autoSubmitExam;

async function autoSubmitExam() {
  submitBtn.disabled = true;

  const answers = {};
  document.querySelectorAll(".question-card").forEach(card => {
    const qId = card.id.replace("q_", "");
    const sel = card.querySelector("input:checked");
    answers[qId] = sel ? sel.value : null;
  });

  await update(ref(db, `ExamResults/${examId}/${studentId}`), {
    studentId,
    studentName,
    answers,
    submittedAt: Date.now()
  });

  await update(ref(db, `ExamAccess/${examId}/${studentId}`), {
    lastSubmitAt: Date.now(),
    lastLogoutAt: null
  });

  window.onpopstate = null;
  alert("Exam submitted successfully!");
  location.href = "exam-page.html";
}

// LOGOUT
document.getElementById("logoutBtn").onclick = async () => {
  if (Date.now() - EXAM_START < 60000) {
    alert("Logout allowed after 1 minute.");
    return;
  }

  await update(ref(db, `ExamAccess/${examId}/${studentId}`), {
    lastLogoutAt: Date.now()
  });

  window.onpopstate = null;
  sessionStorage.clear();
  location.href = "exam-login.html";
};
