import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase, ref, get, remove, update
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

/* ================= FIREBASE CONFIG ================= */
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
  ? initializeApp(firebaseConfig, "cbtApp")
  : getApp("cbtApp");

const db = getDatabase(app);

/* ================= GLOBALS ================= */
const testTableBody = document.getElementById("testTableBody");

let viewModal, editModal, deleteModal, linkModal;
let currentExamKey = null;
let generatedExamLink = "";

/* ================= FETCH EXAMS ================= */
async function fetchExams() {
  const snap = await get(ref(db, "Exam"));
  return snap.exists() ? snap.val() : {};
}

/* ================= RENDER TABLE ================= */
async function renderExamTable() {
  const exams = await fetchExams();
  testTableBody.innerHTML = "";

  Object.keys(exams).forEach((key, i) => {
    const exam = exams[key];
    const status = exam.meta.status;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${exam.meta.title}</td>
      <td>${exam.meta.subject}</td>
      <td>${exam.meta.class}</td>
      <td>${exam.meta.dateAssigned}</td>
      <td>
        <span class="badge ${
          status === "Published" ? "bg-success" :
          status === "Archived" ? "bg-danger" :
          "bg-warning"
        }">${status}</span>
      </td>
      <td>
        <button class="btn btn-sm btn-info viewBtn" data-key="${key}">View</button>
        <button class="btn btn-sm btn-warning editBtn" data-key="${key}">Edit</button>
        <button
          class="btn btn-sm btn-secondary linkBtn"
          data-examid="${key}"
          data-status="${status}"
          ${status !== "Published" ? "disabled" : ""}
        >Link</button>
        <button class="btn btn-sm btn-danger deleteBtn" data-key="${key}">
          Delete
        </button>
      </td>
    `;
    testTableBody.appendChild(row);
  });
}

/* ================= EVENT DELEGATION ================= */
document.addEventListener("click", async e => {

  /* LINK */
  const linkBtn = e.target.closest(".linkBtn");
  if (linkBtn) {
    const examId = linkBtn.dataset.examid;
    const status = linkBtn.dataset.status;

    if (status !== "Published") {
      alert("Only PUBLISHED exams can generate a link.");
      return;
    }

    generatedExamLink =
      `${window.location.origin}/exam-login.html?examId=${examId}`;

    document.getElementById("examLinkInput").value = generatedExamLink;
    linkModal.show();
  }

  /* DELETE */
  if (e.target.classList.contains("deleteBtn")) {
    currentExamKey = e.target.dataset.key;
    deleteModal.show();
  }

  /* VIEW */
  if (e.target.classList.contains("viewBtn")) {
    currentExamKey = e.target.dataset.key;
    const snap = await get(ref(db, `Exam/${currentExamKey}`));
    populateViewModal(snap.val());
    viewModal.show();
  }

  /* EDIT */
  if (e.target.classList.contains("editBtn")) {
    currentExamKey = e.target.dataset.key;
    const snap = await get(ref(db, `Exam/${currentExamKey}`));
    populateEditModal(snap.val());
    editModal.show();
  }
});

/* ================= VIEW MODAL ================= */
function populateViewModal(exam) {
  const container = document.getElementById("viewQuestionsContainer");
  container.innerHTML = "";

  if (!exam.questions) {
    container.innerHTML = "<p class='text-muted'>No questions added.</p>";
    return;
  }

  Object.values(exam.questions).forEach((q, i) => {
    container.innerHTML += `
      <div class="mb-3 p-3 border rounded bg-light">
        <p><strong>Q${i + 1}:</strong> ${q.question}</p>
        <ul>
          ${q.options.map(o => `<li>${o}</li>`).join("")}
        </ul>
        <small class="text-success">
          Correct Answer: ${q.correctAnswer}
        </small>
      </div>
    `;
  });
}

/* ================= COPY LINK ================= */ 
document.addEventListener("click", e => { if (e.target.id === "copyExamLinkBtn") 
  { navigator.clipboard.writeText(generatedExamLink); 
    alert("Exam link copied successfully"); } 
  });

/* ================= EDIT MODAL ================= */
function populateEditModal(exam) {
  const container = document.getElementById("editQuestionsContainer");
  container.innerHTML = "";

  if (!exam.questions) exam.questions = {};

  Object.entries(exam.questions).forEach(([key, q], i) => {
    container.innerHTML += createEditQuestionHTML(key, q, i + 1);
  });
}

function createEditQuestionHTML(key, q, index) {
  return `
    <div class="edit-question-card border rounded p-3 mb-3" data-key="${key}">
      <label><strong>Question ${index}</strong></label>

      <textarea class="form-control mb-2 question-text">${q.question}</textarea>

      ${q.options.map(opt => `
        <input class="form-control mb-1 option-text" value="${opt}">
      `).join("")}

      <input class="form-control mt-2 correct-answer"
        value="${q.correctAnswer}"
        placeholder="Correct Answer (A/B/C/D)">
    </div>
  `;
}

//* ================= ADD NEW QUESTION (EDIT) ================= */
document.getElementById("addQuestionBtn").addEventListener("click", () => {
  const container = document.getElementById("editQuestionsContainer");
  const key = "q_" + Date.now();

  container.insertAdjacentHTML("beforeend",
    createEditQuestionHTML(
      key,
      { question: "", options: ["", "", "", ""], correctAnswer: "" },
      container.children.length + 1
    )
  );

  // Scroll to the new question
  container.lastElementChild.scrollIntoView({ behavior: "smooth" });
});

/* ================= SAVE & REPUBLISH ================= */
document.getElementById("saveEditBtn").addEventListener("click", async () => {
  if (!currentExamKey) return;

  const cards = document.querySelectorAll(".edit-question-card");
  const questions = {};

  cards.forEach(card => {
    const key = card.dataset.key;
    const question = card.querySelector(".question-text").value.trim();
    const options = [...card.querySelectorAll(".option-text")].map(o => o.value.trim());
    const correctAnswer = card.querySelector(".correct-answer").value.trim();

    if (!question || options.some(o => !o) || !correctAnswer) return;

    questions[key] = { question, options, correctAnswer };
  });

  if (!Object.keys(questions).length) {
    alert("Add at least one valid question");
    return;
  }

  await update(ref(db, `Exam/${currentExamKey}`), {
    questions,
    "meta/status": "Published"
  });

  editModal.hide();
  renderExamTable();
  alert("Exam updated & republished successfully");
});

/* ================= DELETE CONFIRM ================= */
document.getElementById("confirmDeleteExamBtn")
  .addEventListener("click", async () => {
    await remove(ref(db, `Exam/${currentExamKey}`));
    deleteModal.hide();
    renderExamTable();
  });

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  viewModal = new bootstrap.Modal(document.getElementById("viewExamModal"));
  editModal = new bootstrap.Modal(document.getElementById("editExamModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteExamModal"));
  linkModal = new bootstrap.Modal(document.getElementById("linkExamModal"));
  renderExamTable();
});
