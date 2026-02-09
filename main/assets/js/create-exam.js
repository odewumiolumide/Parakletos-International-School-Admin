import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, push, get, update, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ===============================
// Firebase Config
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyBPecwRMhqVlnf1bDXe553pcYVGm2TEEO0",
  authDomain: "parakletos-cbt-exam.firebaseapp.com",
  projectId: "parakletos-cbt-exam",
  databaseURL: "https://parakletos-cbt-exam-default-rtdb.firebaseio.com",
  storageBucket: "parakletos-cbt-exam.firebasestorage.app",
  messagingSenderId: "891853424979",
  appId: "1:891853424979:web:95af7a4822e9a6a42d39a6"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= ELEMENTS =================
const testForm = document.getElementById("testForm");
const testTitle = document.getElementById("testTitle");
const testDuration = document.getElementById("testDuration");
const testClass = document.getElementById("testClass");
const testSubject = document.getElementById("testSubject");
const testSelector = document.getElementById("testSelector");
const questionSection = document.getElementById("questionSection");
const questionsContainer = document.getElementById("questionsContainer");
const openQuestionForm = document.getElementById("openQuestionForm");
const successModalMsg = document.getElementById("successModalMsg");
const successModal = new bootstrap.Modal(document.getElementById('successModal'));

const randomQuestions = document.getElementById("randomQuestions");
const randomOptions = document.getElementById("randomOptions");
const showScore = document.getElementById("showScore");

const saveDraftBtn = document.getElementById("saveDraftBtn");
const publishTestBtn = document.getElementById("publishTestBtn");
const archiveTestBtn = document.getElementById("archiveTestBtn");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const statusBadge = document.getElementById("testStatusBadge");

// Modal for delete confirmation
const deleteQuestionModal = new bootstrap.Modal(document.getElementById("deleteQuestionModal"));
let deleteTargetCard = null;

let activeExamKey = null;

// ================= HELPERS =================
function showSuccess(msg) {
  successModalMsg.textContent = msg;
  successModal.show();
}

// ================= FETCH EXAMS =================
async function fetchExams() {
  const snapshot = await get(ref(db, "Exam"));
  return snapshot.exists() ? snapshot.val() : {};
}

async function populateTestSelector() {
  const exams = await fetchExams();
  testSelector.innerHTML = '<option value="">Select Exam Title</option>';
  Object.keys(exams).forEach(key => {
    const exam = exams[key];
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = exam.meta.title + " (" + exam.meta.subject + ")";
    testSelector.appendChild(opt);
  });
}

// ================= CREATE EXAM =================
testForm.addEventListener("submit", async e => {
  e.preventDefault();

  const title = testTitle.value.trim();
  const subject = testSubject.value;
  const cls = testClass.value;
  const duration = Number(testDuration.value);

  if (!title || !subject || !cls || duration <= 0) {
    showSuccess("Please fill all fields correctly");
    return;
  }

  // Generate unique exam key
  const examKey = `${title.toLowerCase().replace(/\s+/g, "-")}_${Date.now()}`;
  const examRef = ref(db, `Exam/${examKey}`);

  await set(examRef, {
    meta: {
      title,
      subject,
      class: cls,
      duration,
      status: "Draft",
      dateAssigned: new Date().toLocaleDateString(),
      settings: {
        randomQuestions: randomQuestions.value === "yes",
        randomOptions: randomOptions.value === "yes",
        showScoreAfterExam: showScore.value === "yes"
      }
    },
    questions: {}
  });

  activeExamKey = examKey;
  openQuestionForm.disabled = false;
  await populateTestSelector();
  showSuccess("Exam saved as Draft");
  testForm.reset();
});

// ================= OPEN QUESTIONS =================
openQuestionForm.addEventListener("click", () => {
  questionSection.classList.remove("d-none");
});

// ================= ADD QUESTION =================
addQuestionBtn.addEventListener("click", () => {
  const qNumber = questionsContainer.children.length + 1;
  const card = document.createElement("div");
  card.className = "mb-2 p-2 border rounded question-card";
  card.dataset.key = `q${Date.now()}`; // unique question key
  card.innerHTML = `
    <label>Question ${qNumber}</label>
    <textarea class="form-control mb-1 question-text" placeholder="Type question"></textarea>
    <input class="form-control mb-1 option" placeholder="Option A">
    <input class="form-control mb-1 option" placeholder="Option B">
    <input class="form-control mb-1 option" placeholder="Option C">
    <input class="form-control mb-1 option" placeholder="Option D">
    <select class="form-select mb-1 correct-answer">
      <option value="">Correct Answer</option>
      <option>A</option><option>B</option><option>C</option><option>D</option>
    </select>
    <button class="btn btn-sm btn-danger delete-question">Delete Question</button>
  `;
  questionsContainer.appendChild(card);
});

// ================= QUESTION DELETE =================
questionsContainer.addEventListener("click", async e => {
  if (e.target.classList.contains("delete-question")) {
    deleteTargetCard = e.target.closest(".question-card");
    deleteQuestionModal.show();
  }
});

document.getElementById("confirmDeleteQuestionBtn").addEventListener("click", async () => {
  if (!deleteTargetCard) return;
  const qKey = deleteTargetCard.dataset.key;
  if (testSelector.value) {
    await remove(ref(db, `Exam/${testSelector.value}/questions/${qKey}`));
  }
  deleteTargetCard.remove();
  deleteTargetCard = null;
  deleteQuestionModal.hide();
  showSuccess("Question deleted successfully");
});

// ================= SAVE/STATUS HANDLERS =================
async function saveQuestions() {
  if (!testSelector.value) return;
  const cards = [...questionsContainer.children];
  for (const card of cards) {
    const qKey = card.dataset.key;
    const qText = card.querySelector(".question-text").value.trim();
    const options = [...card.querySelectorAll(".option")].map(o => o.value.trim());
    const correct = card.querySelector(".correct-answer").value;

    if (!qText || options.some(o => !o) || !correct) continue;

    await set(ref(db, `Exam/${testSelector.value}/questions/${qKey}`), { question: qText, options, correctAnswer: correct });
  }
}

async function setStatus(status) {
  if (!testSelector.value) return showSuccess("Select an exam first");

  await saveQuestions(); // save before changing status

  const questionsSnap = await get(ref(db, `Exam/${testSelector.value}/questions`));
  if (status === "Published" && !questionsSnap.exists()) {
    showSuccess("Add at least one question before publishing");
    return;
  }

  await update(ref(db, `Exam/${testSelector.value}/meta`), { status });

  statusBadge.textContent = `Status: ${status}`;
  statusBadge.className =
    "badge " +
    (status === "Published"
      ? "bg-success"
      : status === "Archived"
      ? "bg-danger"
      : "bg-warning");

  // Lock editing after publish
  addQuestionBtn.disabled = status === "Published";
  questionsContainer.querySelectorAll("textarea,input,select")
    .forEach(el => el.disabled = status === "Published");

  showSuccess(`Exam ${status} successfully`);
}

saveDraftBtn.addEventListener("click", () => setStatus("Draft"));
publishTestBtn.addEventListener("click", () => setStatus("Published"));
archiveTestBtn.addEventListener("click", () => setStatus("Archived"));

// ================= INIT =================
document.addEventListener("DOMContentLoaded", populateTestSelector);
