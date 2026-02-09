import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get } from
  "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

/* ================= FIREBASE ================= */
const config = {
  apiKey: "AIzaSyBPecwRMhqVlnf1bDXe553pcYVGm2TEEO0",
  authDomain: "parakletos-cbt-exam.firebaseapp.com",
  projectId: "parakletos-cbt-exam",
  databaseURL: "https://parakletos-cbt-exam-default-rtdb.firebaseio.com",
};

const app = !getApps().length
  ? initializeApp(config, "cbtExamApp")
  : getApp("cbtExamApp");

const db = getDatabase(app);

/* ================= ELEMENTS ================= */
const tbody = document.getElementById("examResultsBody");
const classFilter = document.getElementById("classFilter");
const subjectFilter = document.getElementById("subjectFilter");

/* ================= STATE ================= */
let EXAMS = {};
let RESULTS = {};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const examSnap = await get(ref(db, "Exam"));
  const resultSnap = await get(ref(db, "ExamResults"));

  EXAMS = examSnap.exists() ? examSnap.val() : {};
  RESULTS = resultSnap.exists() ? resultSnap.val() : {};

  populateClassFilter();
  renderTable();
});

/* ================= CLASS DROPDOWN ================= */
function populateClassFilter() {
  const classes = new Set();

  Object.values(EXAMS).forEach(exam => {
    if (exam.meta?.class) classes.add(exam.meta.class);
  });

  classFilter.innerHTML =
    `<option value="">Select Class</option>` +
    [...classes].map(c => `<option value="${c}">${c}</option>`).join("");
}

/* ================= SUBJECT DROPDOWN ================= */
function populateSubjectFilter(selectedClass) {
  const subjects = new Set();

  Object.values(EXAMS).forEach(exam => {
    if (
      exam.meta?.class === selectedClass &&
      exam.meta?.subject
    ) {
      subjects.add(exam.meta.subject);
    }
  });

  subjectFilter.innerHTML =
    `<option value="">Select Subject</option>` +
    [...subjects].map(s => `<option value="${s}">${s}</option>`).join("");
}

/* ================= FILTER EVENTS ================= */
classFilter.addEventListener("change", () => {
  populateSubjectFilter(classFilter.value);
  renderTable();
});

subjectFilter.addEventListener("change", renderTable);

/* ================= MAIN TABLE ================= */
function renderTable() {
  const selectedClass = classFilter.value;
  const selectedSubject = subjectFilter.value;

  let sn = 1;
  let rows = "";

  for (const examId in RESULTS) {
    const exam = EXAMS[examId];
    if (!exam || !exam.meta) continue;

    const { class: examClass, subject } = exam.meta;

    // 🔐 FILTER
    if (selectedClass && examClass !== selectedClass) continue;
    if (selectedSubject && subject !== selectedSubject) continue;

    const questions = exam.questions || {};
    const totalQ = Object.keys(questions).length;
    const passMark = Math.ceil(totalQ * 0.5);

    for (const studentId in RESULTS[examId]) {
      const r = RESULTS[examId][studentId];
      let correct = 0;

      for (const qId in questions) {
        const ans = r.answers?.[qId];
        if (!ans) continue;

        const correctLetter = questions[qId].correctAnswer;
        const correctText =
          questions[qId].options[
            ["A", "B", "C", "D"].indexOf(correctLetter)
          ];

        if (ans === correctText) correct++;
      }

      const wrong = totalQ - correct;
      const passed = correct >= passMark;

      rows += `
        <tr>
          <td>${sn++}</td>
          <td>${subject}</td>
          <td>${r.studentName || "Unknown"}</td>
          <td>${totalQ}</td>
          <td>${correct}</td>
          <td>${wrong}</td>
          <td>${correct}</td>
          <td>
            <span class="badge ${passed ? "bg-success" : "bg-danger"}">
              ${passed ? "Pass" : "Fail"}
            </span>
          </td>
        </tr>
      `;
    }
  }

  tbody.innerHTML =
    rows ||
    `<tr>
      <td colspan="8" class="text-center text-danger">
        No results found for this selection
      </td>
    </tr>`;
}
