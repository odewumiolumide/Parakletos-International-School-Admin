// result-add.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { saveResult } from "./result-save.js";

// ---------------------------
// Firebase Configs
// ---------------------------
const studentFirebaseConfig = {
   apiKey: "AIzaSyBZMWQcbpd7_dC9qS_C3QWk0P8xT5c8050",
  authDomain: "parakletos-students.firebaseapp.com",
  databaseURL: "https://parakletos-students-default-rtdb.firebaseio.com",
  projectId: "parakletos-students",
  storageBucket: "parakletos-students.firebasestorage.app",
  messagingSenderId: "388683135152",
  appId: "1:388683135152:web:e0200e0b5042e329c36375"
};


const resultFirebaseConfig = {
  apiKey: "AIzaSyBqBTuNUD2pf2XUVnhKH9t7PyVSmQtD4c4",
  authDomain: "parakletos-result.firebaseapp.com",
  projectId: "parakletos-result",
  storageBucket: "parakletos-result.firebasestorage.app",
  messagingSenderId: "564891658192",
  appId: "1:564891658192:web:1b3b5ad91e53f94a5bbbd5"
};

// ---------------------------
// Initialize Firebase Apps
// ---------------------------
const studentApp = initializeApp(studentFirebaseConfig, "studentDB");
const studentDb = getDatabase(studentApp);

const resultApp = initializeApp(resultFirebaseConfig, "resultDB");
const resultDb = getDatabase(resultApp);

// ---------------------------
// Page Setup
// ---------------------------
const urlParams = new URLSearchParams(window.location.search);
const studentID = urlParams.get("id");
document.getElementById("dateIssued").textContent = new Date().toLocaleDateString();

const tbody = document.getElementById("resultTableBody");


// ---------------------------
// Notification Helper
// ---------------------------
function showNotification(message, success) {
  const msgDiv = document.getElementById("notificationMessage");
  if (!msgDiv) return alert(message);

  msgDiv.textContent = message;
  msgDiv.style.color = success ? "green" : "red";

  const modalEl = document.getElementById("notificationModal");
  let modal = bootstrap.Modal.getInstance(modalEl);

  if (!modal) modal = new bootstrap.Modal(modalEl);
  modal.show();

  modalEl.addEventListener('hidden.bs.modal', () => {
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
  }, { once: true });
}

// ---------------------------
// Term Change Logic
// ---------------------------
document.getElementById("studentTerm").addEventListener("change", async (e) => {
  const term = e.target.value;

  const attendanceDetailsContainer = document.querySelectorAll('.p-3.mt-4.border-top')[0];
  const remarksContainer = document.querySelectorAll('.p-3.mt-4.border-top')[1];

  if (term === "Yearly Summary") {
    yearlySummaryContainer.style.display = "block";
    document.getElementById("resultTable").parentElement.style.display = "none";
    await loadYearlySummary();
    document.getElementById("printButton").style.display = "block";
    document.getElementById("addRow").style.display = "none";
    attendanceDetailsContainer.style.display = "none";
    remarksContainer.style.display = "none";
  } else {
    yearlySummaryContainer.style.display = "none";
    document.getElementById("printButton").style.display = "none";
    document.getElementById("addRow").style.display = "block";
    document.getElementById("resultTable").parentElement.style.display = "block";
     document.getElementById("resultTableCa").parentElement.style.display = "block";
      document.getElementById("resultTableExam").parentElement.style.display = "block";
    await loadPreviousResults(term);
    attendanceDetailsContainer.style.display = "block";
    remarksContainer.style.display = "block";
  }
});

// ======================================================
// Load Student Info + Auto Load Subjects for Class
// ======================================================

let isSS3 = false;

// ---------------------------
// Load Student Info
// ---------------------------
async function loadStudent() {
  try {
    const snap = await get(ref(studentDb, `Students/${studentID}`));

    if (!snap.exists()) {
      showNotification("❌ Student not found!", false);
      return;
    }

    const data = snap.val();

    // Load Student Bio
    document.getElementById("studentName").textContent = data.name || "N/A";
    document.getElementById("studentClass").textContent = data.studentClass || "N/A";
    document.getElementById("studentGender").textContent = data.gender || "N/A";

    // Detect SS3 (SS3 / SS 3 / SSS3 / SSS 3)
    const normalized = data.studentClass.replace(/\s+/g, "").toUpperCase();
    isSS3 = (normalized === "SS3" || normalized === "SSS3");

    console.log("SS3 Detected:", isSS3);

    // Load subjects
    loadDefaultSubjectsForClass(data.studentClass);

  } catch (err) {
    showNotification("⚠️ Error loading student info: " + err.message, false);
  }
}

// ======================================================
// AUTO LOAD SUBJECTS BASED ON CLASS + ORDERING LOGIC
// ======================================================

function loadDefaultSubjectsForClass(studentClass) {
  if (!studentClass) return;

  const cls = studentClass.trim().toLowerCase();
  const norm = cls.replace(/[\s-]/g, ""); // remove spaces & hyphens

  tbody.innerHTML = ""; // Clear table

  // Map normalized input → defaultSubjects key
  const classMap = {
    "prenusery": "preNusery", // fix for "Pre Nusery"
    "nusery1": "prebasic1",
    "nursery1": "prebasic1",
    "nusery2": "prebasic2",
    "nursery2": "prebasic2",
    "prepgrade": "prebasic3",
    "grade1": "basic1",
    "grade2": "basic2",
    "grade3": "basic3",
    "grade4": "basic4",
    "grade5": "basic5",
    "jss1": "jss1",
    "jss2": "jss2",
    "jss3": "jss3",
    "sss1": "sss1",
    "sss2": "sss2",
    "sss3": "sss3"
  };

  const matchKey = classMap[norm];

  if (!matchKey || !defaultSubjects[matchKey]) {
    console.log("No default subjects for this class:", studentClass);
    return;
  }

  let subjects = [...defaultSubjects[matchKey]];

  const math = subjects.filter(s => s.toLowerCase().includes("math"));
  const eng = subjects.filter(s => s.toLowerCase().startsWith("english"));
  const remaining = subjects.filter(s => !math.includes(s) && !eng.includes(s));

  remaining.sort((a, b) => a.localeCompare(b));

  const orderedSubjects = [...math, ...eng, ...remaining];

  orderedSubjects.forEach(sub => addSubjectRow(sub));

  console.log("Subjects Loaded:", orderedSubjects);
}

// ======================================================
// DEFAULT SUBJECT LISTS FOR EACH CLASS
// ======================================================

const defaultSubjects = {

  preNusery: [
    "English (letter work)",
    "Mathematics (Number work)",
    "Social Habit",
    "Health Habit",
    "Diction",
    "PHE",
    "Elementary Science",
    "Rhymes",
    "Writing",
    "Fine Art/ colour"
  ],

  prebasic1: [
    "English (letter work)",
    "Mathematics (Number work)",
    "Social Habit",
    "Health Habit",
    "Diction",
    "PHE",
    "Elementary Science",
    "Rhymes",
    "Writing",
    "Fine Art/ colour",
    "QR",
    "VR",
    "Literature",
    "Dictation"
  ],

  prebasic2: [
    "English (letter work)",
    "Mathematics (Number work)",
    "Social Habit",
    "Health Habit",
    "Diction",
    "PHE",
    "Elementary Science",
    "Rhymes",
    "Writing",
    "Fine Art/ colour",
    "QR",
    "VR",
    "Literature",
    "Dictation"
  ],

  prebasic3: [
    "English (letter work)",
    "Mathematics (Number work)",
    "Social Habit",
    "Health Habit",
    "Diction",
    "PHE",
    "Elementary Science",
    "Rhymes",
    "Writing",
    "Fine Art/ colour",
    "QR",
    "VR",
    "Literature",
    "Dictation"
  ],

  basic1: [
    "Mathematics", "English Studies", "Diction", "BST", "Literature",
    "Quatitative Reasoning", "Verbal Reasoning", "CCA", "CRS",
    "Yoruba", "NVE", "History", "Dictation", "Writing"
  ],

  basic2: [
    "Mathematics", "English Studies", "Diction", "BST", "Literature",
    "Quatitative Reasoning", "Verbal Reasoning", "CCA", "CRS",
    "Yoruba", "NVE", "History", "Dictation", "Writing"
  ],

  basic3: [
    "Mathematics", "English Studies", "Diction", "BST", "Literature",
    "Quatitative Reasoning", "Verbal Reasoning", "CCA", "CRS",
    "Yoruba", "NVE", "History", "Dictation", "Writing"
  ],

  basic4: [
    "Mathematics", "English Studies", "Diction", "PVS", "BST",
    "Literature", "Quatitative Reasoning", "Verbal Reasoning",
    "CCA", "CRS", "Yoruba", "NVE", "History", "Dictation", "Writing"
  ],

  basic5: [
    "Mathematics", "English Studies", "Diction", "PVS", "BST",
    "Literature", "Quatitative Reasoning", "Verbal Reasoning",
    "CCA", "CRS", "Yoruba", "NVE", "History", "Dictation", "Writing"
  ],

  jss1: [
    "Mathematics", "English",
    "Physical and Health Education (PHE)",
    "Business studies (BS)", "Social and citizenship studies",
    "Basic Science and Technology (BST)", "Christian Religion Studies (CRS)",
    "Cultural and creative Art (CCA)", "Nigeria History",
    "Diction", "Digital Technology", "Dictation", "Yoruba"
  ],

  jss2: [
    "Mathematics", "English",
    "Pre- vocational studies (PVS)",
    "Business studies (BS)", "National Value Education (NVE)",
    "Basic Science and Technology (BST)", "Christian Religion Studies (CRS)",
    "Cultural and creative Art (CCA)", "Nigeria History",
    "Diction", "Information and Communication Technology (ICT)",
    "Dictation", "Yoruba"
  ],

  jss3: [
    "Mathematics", "English",
    "Pre- vocational studies (PVS)",
    "Business studies (BS)", "National Value Education (NVE)",
    "Basic Science and Technology (BST)", "Christian Religion Studies (CRS)",
    "Cultural and creative Art (CCA)", "Nigeria History",
    "Diction", "Information and Communication Technology (ICT)",
    "Dictation", "Yoruba"
  ],

  sss1: [
    "Mathematics", "English", "Citizenship & Heritage Studies (CHS)",
    "Economics", "Digital Technology", "Phonics"
  ],

  sss2: [
    "Mathematics", "English", "Civic- Education", "ICT", "Phonics"
  ],

  sss3: [
    "Mathematics", "English", "Civic- Education", "ICT", "Phonics"
  ]
};

// ======================================================
// START
// ======================================================

loadStudent();


// ---------------------------
// Add Subject Row
// ---------------------------
function addSubjectRow(subject = "", ca1 = "", ca2 = "", exam = "", total = "0", grade = "-", remark = "-", readOnly = false) {
  const row = document.createElement("tr");

  if (isSS3) {
    // SS3 — Exam Only
    row.innerHTML = `
      <td class="sl">${tbody.children.length + 1}</td>
      <td><input type="text" class="form-control subject-input" value="${subject}" ${readOnly ? "readonly" : ""}></td>
      <td colspan="3" class="text-center text-danger fw-bold">NO C.A IN SS3</td>
      <td><input type="number" class="form-control mark-exam" value="100" readonly></td>
      <td><input type="number" class="form-control exam-input" value="${exam}" min="0" max="100" ${readOnly ? "readonly" : ""}></td>
      <td class="total-score">${total}</td>
      <td class="grade">${grade}</td>
      <td class="remark">${remark}</td>
      <td class="text-center">${readOnly ? "" : '<button class="btn btn-danger btn-sm remove-row">✕</button>'}</td>
    `;
  } else {
    // NORMAL CLASSES — CA1 = 50, CA2 = 50
    row.innerHTML = `
      <td class="sl">${tbody.children.length + 1}</td>
      <td><input type="text" class="form-control subject-input" value="${subject}" ${readOnly ? "readonly" : ""}></td>

      <td><input type="number" class="form-control mark-ca" value="50" readonly></td>

      <td><input type="number" class="form-control ca-input" value="${ca1}" min="0" max="50" ${readOnly ? "readonly" : ""}></td>
      <td><input type="number" class="form-control ca-input" value="${ca2}" min="0" max="50" ${readOnly ? "readonly" : ""}></td>

      <td><input type="number" class="form-control mark-exam" value="100" readonly></td>
      <td><input type="number" class="form-control exam-input" value="${exam}" min="0" max="100" ${readOnly ? "readonly" : ""}></td>

      <td class="total-score">${total}</td>
      <td class="grade">${grade}</td>
      <td class="remark">${remark}</td>

      <td class="text-center">${readOnly ? "" : '<button class="btn btn-danger btn-sm remove-row">✕</button>'}</td>
    `;
  }

  tbody.appendChild(row);
  refreshRowNumbers();
}

// ---------------------------
function refreshRowNumbers() {
  Array.from(tbody.children).forEach((tr, i) =>
    tr.querySelector(".sl").textContent = i + 1
  );
}

// ---------------------------
// Add / Remove Rows
// ---------------------------
document.getElementById("addRow").addEventListener("click", () => addSubjectRow());
tbody.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-row")) {
    e.target.closest("tr").remove();
    refreshRowNumbers();
  }
});

// ---------------------------
// Auto Calculate with CA Average
// ---------------------------
tbody.addEventListener("input", (e) => {
  const tr = e.target.closest("tr");
  if (!tr) return;

  // SS3 — exam only
  if (isSS3) {
    const exam = parseInt(tr.querySelector(".exam-input").value) || 0;
    tr.querySelector(".total-score").textContent = exam;
    updateGrade(tr, exam);
    return;
  }

  // Normal classes
  const caInputs = tr.querySelectorAll(".ca-input");
  const examInput = tr.querySelector(".exam-input");

  let ca1 = parseInt(caInputs[0].value) || 0;
  let ca2 = parseInt(caInputs[1].value) || 0;

  if (ca1 > 50) { alert("CA1 cannot exceed 50"); ca1 = caInputs[0].value = 0; }
  if (ca2 > 50) { alert("CA2 cannot exceed 50"); ca2 = caInputs[1].value = 0; }

  // *** NEW CA LOGIC ***
  const caFinal = (ca1 + ca2) / 2;  // average of CA1 and CA2

  const exam = parseInt(examInput.value) || 0;

  const total = caFinal + exam;

  tr.querySelector(".total-score").textContent = total.toFixed(1);
  updateGrade(tr, total);
});

// ---------------------------
// Exam validation
// ---------------------------
tbody.addEventListener("input", (e) => {
  const tr = e.target.closest("tr");
  if (!tr) return;

  if (e.target.classList.contains("exam-input")) {
    if (parseInt(e.target.value) > 100) {
      alert("Exam cannot exceed 100");
      e.target.value = 0;
    }
  }
});


// ---------------------------
// Grade Logic
// ---------------------------
function updateGrade(tr, total) {
  let grade = "-", remark = "-";

  if (total >= 85) {
  grade = "A";
  remark = "Excellent";
} 
else if (total >= 75) {
  grade = "B";
  remark = "Very Good";
} 
else if (total >= 55) {
  grade = "C";
  remark = "Good";
} 
else if (total >= 40) {
  grade = "D";
  remark = "Average";
} 
else {
  grade = "E";
  remark = "Needs Improvement";
}


  tr.querySelector(".grade").textContent = grade;
  tr.querySelector(".remark").textContent = remark;
}

// ---------------------------
// Prevent Save if Invalid
// ---------------------------
document.getElementById("saveResult").addEventListener("click", () => {
  let invalidGrade = false;

  tbody.querySelectorAll(".grade").forEach(cell => {
    const v = cell.textContent;
    if (!["A1","B2","B3","C4","C5","C6","D7","E8","F9"].includes(v))
      invalidGrade = true;
  });

  if (invalidGrade) {
    return alert("❌ Cannot save. Some grade inputs are invalid!");
  }

  // SAVE LOGIC HERE...
});

// ---------------------------
// Attendance Input Validation
// ---------------------------
const attendanceInputs = ["daysOpened", "daysPresent", "daysAbsent", "studentHeight", "studentWeight"];
attendanceInputs.forEach(id => {
  const input = document.getElementById(id);

  input.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, ""); // remove non-digit chars
    if (val.length > 3) val = val.slice(0, 3);   // max 3 digits
    e.target.value = val;
  });

  input.addEventListener("blur", (e) => {
    if (e.target.value !== "") e.target.value = parseInt(e.target.value, 10);
  });
});

// Attendance calculation: Days Opened = Present + Absent
const daysOpenedInput = document.getElementById("daysOpened");
const daysPresentInput = document.getElementById("daysPresent");
const daysAbsentInput = document.getElementById("daysAbsent");

function validateAttendance() {
  const opened = parseInt(daysOpenedInput.value) || 0;
  const present = parseInt(daysPresentInput.value) || 0;
  const absent = parseInt(daysAbsentInput.value) || 0;

  if (opened !== (present + absent)) {
    daysOpenedInput.setCustomValidity("Days Opened must equal Days Present + Days Absent");
    daysOpenedInput.reportValidity();
  } else {
    daysOpenedInput.setCustomValidity("");
  }
}

[daysOpenedInput, daysPresentInput, daysAbsentInput].forEach(input => {
  input.addEventListener("input", validateAttendance);
});

// ---------------------------
// Affective & Psychomotor Domain Validation
// ---------------------------
const remarkFields = [
  "Neatness", "Politeness", "Punctuality", "Responsibility",
  "Teamwork", "Leadership", "Helping", "Honesty", "Participation"
];

remarkFields.forEach(id => {
  const textarea = document.getElementById(id);
  textarea.addEventListener("input", (e) => {
    let val = e.target.value.toUpperCase();
    if (val.length > 1 || !["A", "B", "C", "D", "E"].includes(val)) {
      alert(`❌ Invalid input for ${id}! Only a single character A, B, C, D, or E is allowed.`);
      e.target.value = "";
    } else {
      e.target.value = val;
    }
  });
});

// ----------------------------------------------
// Auto Move to Next Affective Field When Enter is Pressed
// ----------------------------------------------
remarkFields.forEach((id, index) => {
  const field = document.getElementById(id);

  field.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent newline

      const nextFieldID = remarkFields[index + 1];
      if (nextFieldID) {
        document.getElementById(nextFieldID).focus();
      }
    }
  });
});

// Auto Teacher Remarks //
document.getElementById("remarkSelect").addEventListener("change", function () {
    const selectedRemark = this.value;
    const remarkBox = document.getElementById("classTeacherRemark");

    // Auto-fill the textarea
    remarkBox.value = selectedRemark;
});


// ---------------------------
// Load Previous Results
// ---------------------------
async function loadPreviousResults() {
  const term = document.getElementById("studentTerm")?.value?.trim();
  if (!term || !studentID) return;

  try {
    const snapshot = await get(ref(resultDb, `Results/${studentID}/${term}`));

    if (snapshot.exists()) {
      // Only clear table when actual saved results exist
      tbody.innerHTML = "";

      const data = snapshot.val();
      const subjects = data.Subjects || {};

      Object.keys(subjects).forEach(sub => {
        const s = subjects[sub];
        addSubjectRow(
          s.subject || sub,
          s.ca1 || 0,
          s.ca2 || 0,
          s.exam || 0,
          s.total || 0,
          s.grade || "-",
          s.remark || "-",
          true
        );
      });

      document.getElementById("classTeacherRemark").value = data.classTeacherRemark || "";
      document.getElementById("headTeacherRemark").value = data.headTeacherRemark || "";
      document.getElementById("Neatness").value = data.Neatness || "";
      document.getElementById("Politeness").value = data.Politeness || "";
      document.getElementById("Punctuality").value = data.Punctuality || "";
      document.getElementById("Responsibility").value = data.Responsibility || "";
      document.getElementById("Teamwork").value = data.Teamwork || "";
      document.getElementById("Leadership").value = data.Leadership || "";
      document.getElementById("Helping").value = data.Helping || "";
      document.getElementById("Honesty").value = data.Honesty || "";
      document.getElementById("Participation").value = data.Participation || "";
      document.getElementById("daysOpened").value = data.daysOpened || "";
      document.getElementById("daysPresent").value = data.daysPresent || "";
      document.getElementById("daysAbsent").value = data.daysAbsent || "";
      document.getElementById("studentHeight").value = data.studentHeight || "";
      document.getElementById("studentWeight").value = data.studentWeight || "";
      document.getElementById("nextTermDate").value = data.nextTermDate || "";

      showNotification("✅ Loaded previous results!", true);

    } else {
      // DO NOT CLEAR THE TABLE HERE
      // DO NOT REMOVE DEFAULT SUBJECTS

      showNotification("ℹ️ No previous result found.", false);
    }
  } catch (err) {
    console.error(err);
    showNotification("⚠️ Failed to load results: " + err.message, false);
  }
}

document.getElementById("studentTerm").addEventListener("change", loadPreviousResults);
window.addEventListener("load", () => setTimeout(loadPreviousResults, 200));


// ---------------------------
// Save Result (Updated for SS3 & Normal Classes)
// ---------------------------
document.getElementById("saveResult").addEventListener("click", async () => {
  const term = document.getElementById("studentTerm").value.trim();
  const classTeacherRemark = document.getElementById("classTeacherRemark").value.trim();
  const headTeacherRemark = document.getElementById("headTeacherRemark").value.trim();
  const Neatness = document.getElementById("Neatness").value.trim();
  const Politeness = document.getElementById("Politeness").value.trim();
  const Punctuality = document.getElementById("Punctuality").value.trim();
  const Responsibility = document.getElementById("Responsibility").value.trim();
  const Teamwork = document.getElementById("Teamwork").value.trim();
  const Leadership = document.getElementById("Leadership").value.trim();
  const Helping = document.getElementById("Helping").value.trim();
  const Honesty = document.getElementById("Honesty").value.trim();
  const Participation = document.getElementById("Participation").value.trim();
  const daysOpened = document.getElementById("daysOpened").value.trim();
  const daysPresent = document.getElementById("daysPresent").value.trim();
  const daysAbsent = document.getElementById("daysAbsent").value.trim();
  const studentHeight = document.getElementById("studentHeight").value.trim();
  const studentWeight = document.getElementById("studentWeight").value.trim();
  const nextTermDate = document.getElementById("nextTermDate").value.trim();

  const subjects = [];
  tbody.querySelectorAll("tr").forEach(tr => {
    const subjectInput = tr.querySelector(".subject-input");
    const examInput = tr.querySelector(".exam-input");
    const caInputs = tr.querySelectorAll(".ca-input");

    const subject = subjectInput ? subjectInput.value.trim() : "";
    const exam = examInput ? parseInt(examInput.value) || 0 : 0;

    // Only take CA values if they exist (normal classes)
    const ca1 = caInputs.length > 0 ? parseInt(caInputs[0].value) || 0 : 0;
    const ca2 = caInputs.length > 1 ? parseInt(caInputs[1].value) || 0 : 0;

    const total = ca1 + ca2 + exam;
    const grade = tr.querySelector(".grade")?.textContent || "-";
    const remark = tr.querySelector(".remark")?.textContent || "-";

    // Save row if editable or SS3 (even though SS3 has no CA)
    if (subject && (!subjectInput.readOnly || isSS3)) {
      subjects.push({ subject, ca1, ca2, exam, total, grade, remark });
    }
  });

  if (!subjects.length && !classTeacherRemark.length) {
    return showNotification("⚠️ Add at least one new subject or comment before saving.", false);
  }

  const resultData = {
    studentID,
    term,
    classTeacherRemark,
    headTeacherRemark,
    Neatness,
    Politeness,
    Punctuality,
    Responsibility,
    Teamwork,
    Leadership,
    Helping,
    Honesty,
    Participation,
    daysOpened,
    daysPresent,
    daysAbsent,
    studentHeight,
    studentWeight,
    nextTermDate,
    dateIssued: new Date().toLocaleDateString(),
    subjects
  };

  try {
    const res = await saveResult(studentID, term, resultData);
    showNotification(res.message, res.success);
    if (res.success) setTimeout(loadPreviousResults, 400);
  } catch (err) {
    console.error(err);
    showNotification("⚠️ Failed to save result: " + err.message, false);
  }
});

// ---------------------------
// All Result To Print Result Function (Auto Print After 2s + Dynamic File Name)
// ---------------------------
document.getElementById("PrintResult").addEventListener("click", () => {
  const modal = new bootstrap.Modal(document.getElementById("printConfirmModal"));
  modal.show();

  document.getElementById("confirmPrintBtn").onclick = () => {
    modal.hide();

    // Hide "Add New Subject" button temporarily
    const addSubjectBtn = document.getElementById("addRow");
    if (addSubjectBtn) addSubjectBtn.style.display = "none";

    // Clone and clean result table
    const resultTable = document.getElementById("resultTable").cloneNode(true);

    // Remove "Action" column
    const headerRow = resultTable.querySelector("thead tr");
    if (headerRow && headerRow.lastElementChild.textContent.trim().toLowerCase() === "action") {
      headerRow.removeChild(headerRow.lastElementChild);
    }

    // Remove "Action" cells in body
    resultTable.querySelectorAll("tbody tr").forEach(row => {
      if (row.lastElementChild) row.removeChild(row.lastElementChild);
    });

    // Convert inputs to plain text
    resultTable.querySelectorAll("input, select").forEach(el => {
      const td = el.parentElement;
      td.textContent = el.value || "-";
    });

    // Get student info
    const studentName = document.getElementById("studentName").textContent.trim();
    const studentGender = document.getElementById("studentGender").textContent.trim();
    const studentClass = document.getElementById("studentClass").textContent.trim();
    const term = document.getElementById("studentTerm").value || document.getElementById("studentTerm").textContent.trim();
    const dateIssued = document.getElementById("dateIssued").textContent.trim();
    const sessionYear = document.getElementById("sessionYear")?.textContent.trim() || "2025/2026";
    const classRemark = document.getElementById("classTeacherRemark").value || "-";
    const headRemark = document.getElementById("headTeacherRemark").value || "-";
    const Neatness = document.getElementById("Neatness")?.value || "-";
    const Politeness = document.getElementById("Politeness")?.value || "-";
    const Punctuality = document.getElementById("Punctuality")?.value || "-";
    const Responsibility = document.getElementById("Responsibility")?.value || "-";
    const Leadership = document.getElementById("Leadership")?.value || "-";
    const Helping = document.getElementById("Helping")?.value || "-";
    const Honesty = document.getElementById("Honesty")?.value || "-";
    const Teamwork = document.getElementById("Teamwork")?.value || "-";
    const daysOpened = document.getElementById("daysOpened")?.value || "-";
    const daysPresent = document.getElementById("daysPresent")?.value || "-";
    const daysAbsent = document.getElementById("daysAbsent")?.value || "-";
    const studentHeight = document.getElementById("studentHeight")?.value || "-";
    const studentWeight = document.getElementById("studentWeight")?.value || "-";
    const nextTermDate = document.getElementById("nextTermDate")?.value || "-";

    // Calculate total and average
const totals = Array.from(resultTable.querySelectorAll(".total-score")).map(td => parseInt(td.textContent) || 0);
const totalScore = totals.reduce((a, b) => a + b, 0);
const avgScore = totals.length ? (totalScore / totals.length).toFixed(2) : "0.00";

// -----------------------------
// Set Head Teacher Remark dynamically
// -----------------------------
let headRemarkAuto = "-";

if (avgScore >= 75) headRemarkAuto = "Outstanding achievement! Keep up the excellent work and continue striving for success.";
else if (avgScore >= 60) headRemarkAuto = "Very good performance. Well done! Maintain this effort to reach higher goals.";
else if (avgScore >= 50) headRemarkAuto = "Good performance. Keep working consistently to improve further.";
else if (avgScore >= 40) headRemarkAuto = "Satisfactory performance. There is room for improvement with more focus and effort.";
else headRemarkAuto = "Performance needs attention. Extra effort and dedication are recommended to improve in the next term.";


// Update the readonly textarea in your HTML
document.getElementById("headTeacherRemark").value = headRemarkAuto;

// In the print template, just use headRemarkAuto



    // Build print window
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    printWindow.document.open();
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Student Result | Parakletos International School </title>
<style>
  body {
    font-family: "Segoe UI", "Calibri", sans-serif;
    background: #fff;
    color: #1c1c1c;
    margin: 30px;
    line-height: 1.6;
    position: relative;
  }

  /* Watermark */
  body::before {
    content: "";
    position: fixed;
    top: 50%;
    left: 50%;
    width: 700px;
    height: 700px;
    background: url('assets/images/auth/para logo.jpeg') no-repeat center center;
    background-size: 50%;
    opacity: 0.05;
    transform: translate(-50%, -50%);
    z-index: -1;
  }

  .school-logo {
    width: 180px;            /* bigger logo */
    height: auto;
    display: block;
    margin: 10px auto;
    border: 4px solid #c8102e;
    border-radius: 15px;
    padding: 6px;
    box-shadow: 0 5px 12px rgba(0,0,0,0.25);
    transform: scale(1.1);   /* prevents shrinking */
    }

  .header {
    text-align: center;
    margin-bottom: 35px;
    position: relative;
  }

  .header img { width: 100px; margin-bottom: 10px; }
  .header h3 { font-size: 26px;         /* larger bold heading */
    font-weight: 900;        /* heavy bold */
    color: #c8102e;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3); /* makes it stand out */
    margin-top: 5px; }
  .header p { margin: 2px 0; font-size: 13px; }

  .header::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 3px;
    background: linear-gradient(to right, #c8102e, #000);
    border-radius: 5px;
  }

  .row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 25px; }
  .col {
    flex: 1; min-width: 250px; background: #fff;
    border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    padding: 15px 20px;
  }
  .col h4 { margin-bottom: 8px; font-size: 14px; text-transform: uppercase; color: #fff; background: #c8102e; padding: 5px 10px; border-radius: 5px 5px 0 0; }
  .col ul { list-style: none; padding: 10px 0 0 0; margin: 0; }
  .col ul li { margin: 4px 0; font-size: 13px; }
  .col ul li strong { color: #c8102e; }

  table {
    width: 100%; border-collapse: collapse; margin-bottom: 25px;
    background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  th {
    background: #c8102e; color: #fff; padding: 8px; font-size: 13px; text-align: center;
  }
  td {
    text-align: center; padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px;
  }
  tr:nth-child(even) td { background: #fdfdfd; }
  .grade-tick { color: #c8102e; font-size: 16px; }

  .section-title {
    font-weight: 700; margin: 25px 0 10px 0; font-size: 16px;
    color: #c8102e; text-transform: uppercase; letter-spacing: 0.5px;
    border-left: 5px solid #c8102e; padding-left: 10px;
  }

  .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
  .sign {
    border-top: 2px solid #c8102e; width: 45%; text-align: center;
    padding-top: 8px; font-size: 13px; color: #1c1c1c; font-weight: 600;
  }
  .signature-img {
    width: 80px;
    height: auto;
    display: block;
    margin: 0 auto 5px auto;
    opacity: 0.9;
  }
  .signature-title {
    font-size: 13px;
    font-weight: bold;
    margin-top: 2px;
  }

  @media print {
    body { background: #fff; -webkit-print-color-adjust: exact; }
    @page { size: A4; margin: 1cm; }
  }

  @media print {
  .school-logo {
    transform: scale(1.3) !important; /* boost size in print */
  }

  .header h3 {
    font-size: 30px !important;       /* bigger in print */
    font-weight: 900 !important;
  }

  @page {
    size: A4;
    margin: 0.5cm;
  }
}

  #resultTable td:nth-child(2),
  #resultTable th:nth-child(2),
  #resultTableBody input[name="subject"],
  #resultTableBody select[name="subject"] {
    text-transform: uppercase !important;
  }

</style>
</head>
<body>

<div class="header">
  <img src="assets/images/auth/para logo.jpeg" alt="School Logo" class="school-logo">
  <br>
  <h3>Parakletos International School</h3>
  <p>No 2 Bisi Bankole Street Oke Onitea Osogbo</p>
  <p>EMAIL: parakletosschool2004@gmail.com</p>
  <p>NUMBERS: 08033881702</p>
  <p><strong>Academic Session:</strong> ${sessionYear}</p>
</div>

<div class="row">
  <div class="col">
    <h4>Student Details</h4>
    <ul>
      <li><strong>Name:</strong> ${studentName}</li>
      <li><strong>Gender:</strong> ${studentGender}</li>
      <li><strong>Class:</strong> ${studentClass}</li>
      <li><strong>Term:</strong> ${term}</li>
      <li><strong>Student ID:</strong> ${studentID}</li>
      <li><strong>Date Issued:</strong> ${dateIssued}</li>
    </ul>
  </div>
  <div class="col">
    <h4>Attendance & Physical Record</h4>
    <ul>
      <li><strong>Days Opened:</strong> ${daysOpened}</li>
      <li><strong>Days Present:</strong> ${daysPresent}</li>
      <li><strong>Days Absent:</strong> ${daysAbsent}</li>
      <li><strong>Height:</strong> ${studentHeight} cm</li>
      <li><strong>Weight:</strong> ${studentWeight} kg</li>
      <li><strong>Next Term Begins:</strong> ${nextTermDate}</li>
    </ul>
  </div>
</div>

<div class="section-title">Subjects and Scores</div>
${resultTable.outerHTML}

<div class="row">
  <div class="col">
    <h4>Total Average Score</h4>
    <ul>
      <li><strong>Total Marks:</strong> ${totalScore}</li>
      <li><strong>Average Percentage:</strong> ${avgScore}%</li>
    </ul>
  </div>
  <div class="col">
    <h4>Remarks</h4>
    <ul>
      <li><strong>Class Teacher:</strong> ${classRemark}</li>
      <li><strong>Head Teacher:</strong> ${headRemarkAuto}</li>
    </ul>
  </div>
</div>

<div class="section-title">Affective & Psychomotor Domain (A - E)</div>
<table>
  <thead>
    <tr>
      <th>Area</th>
      <th>A</th>
      <th>B</th>
      <th>C</th>
      <th>D</th>
      <th>E</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Neatness</td>
      <td class="grade-tick">${Neatness=='A'?'✔️':''}</td>
      <td class="grade-tick">${Neatness=='B'?'✔️':''}</td>
      <td class="grade-tick">${Neatness=='C'?'✔️':''}</td>
      <td class="grade-tick">${Neatness=='D'?'✔️':''}</td>
      <td class="grade-tick">${Neatness=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Politeness</td>
      <td class="grade-tick">${Politeness=='A'?'✔️':''}</td>
      <td class="grade-tick">${Politeness=='B'?'✔️':''}</td>
      <td class="grade-tick">${Politeness=='C'?'✔️':''}</td>
      <td class="grade-tick">${Politeness=='D'?'✔️':''}</td>
      <td class="grade-tick">${Politeness=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Punctuality</td>
      <td class="grade-tick">${Punctuality=='A'?'✔️':''}</td>
      <td class="grade-tick">${Punctuality=='B'?'✔️':''}</td>
      <td class="grade-tick">${Punctuality=='C'?'✔️':''}</td>
      <td class="grade-tick">${Punctuality=='D'?'✔️':''}</td>
      <td class="grade-tick">${Punctuality=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Responsibility</td>
      <td class="grade-tick">${Responsibility=='A'?'✔️':''}</td>
      <td class="grade-tick">${Responsibility=='B'?'✔️':''}</td>
      <td class="grade-tick">${Responsibility=='C'?'✔️':''}</td>
      <td class="grade-tick">${Responsibility=='D'?'✔️':''}</td>
      <td class="grade-tick">${Responsibility=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Teamwork</td>
      <td class="grade-tick">${Teamwork=='A'?'✔️':''}</td>
      <td class="grade-tick">${Teamwork=='B'?'✔️':''}</td>
      <td class="grade-tick">${Teamwork=='C'?'✔️':''}</td>
      <td class="grade-tick">${Teamwork=='D'?'✔️':''}</td>
      <td class="grade-tick">${Teamwork=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Leadership</td>
      <td class="grade-tick">${Leadership=='A'?'✔️':''}</td>
      <td class="grade-tick">${Leadership=='B'?'✔️':''}</td>
      <td class="grade-tick">${Leadership=='C'?'✔️':''}</td>
      <td class="grade-tick">${Leadership=='D'?'✔️':''}</td>
      <td class="grade-tick">${Leadership=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Helping Others</td>
      <td class="grade-tick">${Helping=='A'?'✔️':''}</td>
      <td class="grade-tick">${Helping=='B'?'✔️':''}</td>
      <td class="grade-tick">${Helping=='C'?'✔️':''}</td>
      <td class="grade-tick">${Helping=='D'?'✔️':''}</td>
      <td class="grade-tick">${Helping=='E'?'✔️':''}</td>
    </tr>
  </tbody>
</table>

<div class="section-title">System Grading</div>
<table>
  <thead>
    <tr>
      <th>Grade</th>
      <th>Score Range</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
     <tr><td>A</td><td>85-100</td><td>Excellent</td></tr>
    <tr><td>B</td><td>75-84</td><td>Very Good</td></tr>
    <tr><td>C</td><td>55-74</td><td>Good</td></tr>
    <tr><td>D</td><td>40-54</td><td>Average</td></tr>
    <tr><td>E</td><td>0-40</td><td>Needs Improvement</td></tr>
  </tbody>
</table>

<BR>

<div class="signatures">

    <div class="sign">
        <img id="classTeacherSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Class Teacher’s Signature</div>
    </div>

    <div class="sign">
        <img id="proprietorSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Proprietor’s Signature</div>
    </div>

</div>


</body>
</html>
    `);
    printWindow.document.close();

    // Print logic
    printWindow.onload = () => {
      const fileTitle = `${studentName.replace(/\s+/g, "_")}_${studentID}_Result`;
      printWindow.document.title = fileTitle;

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 2000);

      printWindow.onafterprint = printWindow.onbeforeunload = () => {
        printWindow.close();
        location.href = "result-list.html";
      };
    };

    setTimeout(() => {
      if (addSubjectBtn) addSubjectBtn.style.display = "inline-block";
    }, 3000);
  };
});


// ===============================
// PRINT CA RESULT
// ===============================
document.getElementById("PrintCAResult").addEventListener("click", () => {
    const modal = new bootstrap.Modal(document.getElementById("printConfirmModal"));
    modal.show();

    document.getElementById("confirmPrintBtn").onclick = () => {
        modal.hide();

   const addSubjectBtn = document.getElementById("addRow");
if (addSubjectBtn) addSubjectBtn.style.display = "none";

const resultTable = document.getElementById("resultTable").cloneNode(true);

// -------------------------------
// Grade / Remark Function
// -------------------------------
function getGradeAndRemark(score, max) {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return { grade: 'A', remark: 'Excellent' };
    else if (percentage >= 70) return { grade: 'B', remark: 'Very Good' };
    else if (percentage >= 60) return { grade: 'C', remark: 'Good' };
    else if (percentage >= 50) return { grade: 'D', remark: 'Average' };
    else return { grade: 'E', remark: 'Needs Improvement' };
}

// -------------------------------
// Compute TOTAL CA, GRADE AND REMARK PER SUBJECT
// -------------------------------
let allCATotals = [];

resultTable.querySelectorAll("tbody tr").forEach(tr => {
    // COLUMN INDEX:
    // 3 = CA1, 4 = CA2, 7 = TOTAL, 8 = GRADE, 9 = REMARK

    const ca1 = parseFloat(tr.children[3].querySelector("input")?.value) || 0;
    const ca2 = parseFloat(tr.children[4].querySelector("input")?.value) || 0;

    // (CA1 + CA2) / 2 → MAX 50
    let totalCA = (ca1 + ca2) / 2;
    if (totalCA > 50) totalCA = 50;

    tr.children[7].textContent = totalCA; // TOTAL CA per subject
    allCATotals.push(totalCA);

    // Grade & Remark per subject
    const { grade, remark } = getGradeAndRemark(totalCA, 50);
    tr.children[8].textContent = grade;
    tr.children[9].textContent = remark;
});

// -------------------------------
// Compute OVERALL CA TOTAL, AVERAGE PERCENTAGE, GRADE
// -------------------------------
const totalCA = allCATotals.reduce((a, b) => a + b, 0);
const maxCAperSubject = 50;
const overallCAmax = allCATotals.length * maxCAperSubject;
const caAverage = allCATotals.length ? ((totalCA / overallCAmax) * 100).toFixed(2) : "0.00";

// Overall CA Grade
const caGrade = caAverage >= 80 ? "A" :
                caAverage >= 70 ? "B" :
                caAverage >= 60 ? "C" :
                caAverage >= 50 ? "D" : "E";

// -------------------------------
// Compute OVERALL TOTAL SCORE & AVG (renamed)
// -------------------------------
const overallMarksArr = Array.from(resultTable.querySelectorAll(".total-score"))
  .map(td => parseFloat(td.textContent) || 0);
const overallMarks = overallMarksArr.reduce((a, b) => a + b, 0);
const overallPercentage = overallMarksArr.length ? (overallMarks / overallMarksArr.length).toFixed(2) : "0.00";
// -------------------------------
// Hide Exam Columns for CA Print
// -------------------------------
resultTable.querySelectorAll("thead th").forEach((th, i) => {
    const text = th.textContent.toLowerCase().trim();

    if (
        text.includes("exam") ||
        text.includes("mark obtainable (exam)") ||
        text.includes("action")
    ) {
        th.style.display = "none";
        resultTable.querySelectorAll("tbody tr").forEach(tr => {
            if (tr.children[i]) tr.children[i].style.display = "none";
        });
    }
});

// -------------------------------
// Remove Input Fields Before Print
// -------------------------------
resultTable.querySelectorAll("input, select").forEach(el => {
    el.parentElement.textContent = el.value || "-";
});



        // Get student info
    const studentName = document.getElementById("studentName").textContent.trim();
    const studentGender = document.getElementById("studentGender").textContent.trim();
    const studentClass = document.getElementById("studentClass").textContent.trim();
    const term = document.getElementById("studentTerm").value || document.getElementById("studentTerm").textContent.trim();
    const dateIssued = document.getElementById("dateIssued").textContent.trim();
    const sessionYear = document.getElementById("sessionYear")?.textContent.trim() || "2025/2026";
    const classRemark = document.getElementById("classTeacherRemark").value || "-";
    const headRemark = document.getElementById("headTeacherRemark").value || "-";
    const Neatness = document.getElementById("Neatness")?.value || "-";
    const Politeness = document.getElementById("Politeness")?.value || "-";
    const Punctuality = document.getElementById("Punctuality")?.value || "-";
    const Responsibility = document.getElementById("Responsibility")?.value || "-";
    const Leadership = document.getElementById("Leadership")?.value || "-";
    const Helping = document.getElementById("Helping")?.value || "-";
    const Honesty = document.getElementById("Honesty")?.value || "-";
    const Teamwork = document.getElementById("Teamwork")?.value || "-";
    const daysOpened = document.getElementById("daysOpened")?.value || "-";
    const daysPresent = document.getElementById("daysPresent")?.value || "-";
    const daysAbsent = document.getElementById("daysAbsent")?.value || "-";
    const studentHeight = document.getElementById("studentHeight")?.value || "-";
    const studentWeight = document.getElementById("studentWeight")?.value || "-";
    const nextTermDate = document.getElementById("nextTermDate")?.value || "-";


       // Build print window
        const printWindow = window.open("", "_blank", "width=900,height=1000");
        printWindow.document.open();
        printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CA Result - Parakletos International School</title>
<style>
  body {
    font-family: "Segoe UI", "Calibri", sans-serif;
    background: #fff;
    color: #1c1c1c;
    margin: 30px;
    line-height: 1.6;
    position: relative;
  }

  /* Watermark */
  body::before {
    content: "";
    position: fixed;
    top: 50%;
    left: 50%;
    width: 700px;
    height: 700px;
    background: url('assets/images/auth/para logo.jpeg') no-repeat center center;
    background-size: 50%;
    opacity: 0.05;
    transform: translate(-50%, -50%);
    z-index: -1;
  }

  .school-logo {
    width: 180px;            /* bigger logo */
    height: auto;
    display: block;
    margin: 10px auto;
    border: 4px solid #c8102e;
    border-radius: 15px;
    padding: 6px;
    box-shadow: 0 5px 12px rgba(0,0,0,0.25);
    transform: scale(1.1);   /* prevents shrinking */
  }

  .header {
    text-align: center;
    margin-bottom: 35px;
    position: relative;
  }

  .header img { width: 100px; margin-bottom: 10px; }
  .header h3 { font-size: 26px;         /* larger bold heading */
    font-weight: 900;        /* heavy bold */
    color: #c8102e;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3); /* makes it stand out */
    margin-top: 5px; }

  .header p { margin: 2px 0; font-size: 13px; }

  .header::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 3px;
    background: linear-gradient(to right, #c8102e, #000);
    border-radius: 5px;
  }

  .row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 25px; }
  .col {
    flex: 1; min-width: 250px; background: #fff;
    border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    padding: 15px 20px;
  }
  .col h4 { margin-bottom: 8px; font-size: 14px; text-transform: uppercase; color: #fff; background: #c8102e; padding: 5px 10px; border-radius: 5px 5px 0 0; }
  .col ul { list-style: none; padding: 10px 0 0 0; margin: 0; }
  .col ul li { margin: 4px 0; font-size: 13px; }
  .col ul li strong { color: #c8102e; }

  table {
    width: 100%; border-collapse: collapse; margin-bottom: 25px;
    background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  th {
    background: #c8102e; color: #fff; padding: 8px; font-size: 13px; text-align: center;
  }
  td {
    text-align: center; padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px;
  }
  tr:nth-child(even) td { background: #fdfdfd; }
  .grade-tick { color: #c8102e; font-size: 16px; }

  .section-title {
    font-weight: 700; margin: 25px 0 10px 0; font-size: 16px;
    color: #c8102e; text-transform: uppercase; letter-spacing: 0.5px;
    border-left: 5px solid #c8102e; padding-left: 10px;
  }

  .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
  .sign {
    border-top: 2px solid #c8102e; width: 45%; text-align: center;
    padding-top: 8px; font-size: 13px; color: #1c1c1c; font-weight: 600;
  }
  .signature-img {
    width: 80px;
    height: auto;
    display: block;
    margin: 0 auto 5px auto;
    opacity: 0.9;
  }
  .signature-title {
    font-size: 13px;
    font-weight: bold;
    margin-top: 2px;
  }

  @media print {
    body { background: #fff; -webkit-print-color-adjust: exact; }
    @page { size: A4; margin: 1cm; }
  }

  @media print {
  .school-logo {
    transform: scale(1.3) !important; /* boost size in print */
  }

  .header h3 {
    font-size: 30px !important;       /* bigger in print */
    font-weight: 900 !important;
  }

  @page {
    size: A4;
    margin: 0.5cm;
  }
}


  #resultTable td:nth-child(2),
  #resultTable th:nth-child(2),
  #resultTableBody input[name="subject"],
  #resultTableBody select[name="subject"] {
    text-transform: uppercase !important;
  }

</style>
</head>
<body>

<div class="header">
  <img src="assets/images/auth/para logo.jpeg" alt="School Logo">
  <br>
  <h3>Parakletos International School</h3>
  <p>No 2 Bisi Bankole Street Oke Onitea Osogbo</p>
  <p>EMAIL: parakletosschool2004@gmail.com</p>
  <p>NUMBERS: 08033881702</p>
</div>

<div class="row">
  <div class="col">
    <h4>Student Details</h4>
    <ul>
      <li><strong>Name:</strong> ${studentName}</li>
      <li><strong>Gender:</strong> ${studentGender}</li>
      <li><strong>Class:</strong> ${studentClass}</li>
      <li><strong>Term:</strong> ${term}</li>
      <li><strong>Student ID:</strong> ${studentID}</li>
      <li><strong>Date Issued:</strong> ${dateIssued}</li>
    </ul>
  </div>
  <div class="col">
    <h4>Attendance & Physical Record</h4>
    <ul>
      <li><strong>Days Opened:</strong> ${daysOpened}</li>
      <li><strong>Days Present:</strong> ${daysPresent}</li>
      <li><strong>Days Absent:</strong> ${daysAbsent}</li>
      <li><strong>Height:</strong> ${studentHeight} cm</li>
      <li><strong>Weight:</strong> ${studentWeight} kg</li>
      <li><strong>Next Term Begins:</strong> ${nextTermDate}</li>
    </ul>
  </div>
</div>

<div>
  <h4>Continuous Assessment Results</h4>
  ${resultTable.outerHTML}
</div>

<div class="row">
  <div class="col">
    <h4>CA Performance Summary</h4>
    <ul>
      <li><strong>Total CA Marks:</strong> ${totalCA}</li>
      <li><strong>CA Average Percentage:</strong> ${caAverage}%</li>
      <li><strong>CA Grade:</strong> ${caGrade}</li>
    </ul>
  </div>
</div>

<div class="section-title">System Grading</div>
<table>
  <thead>
    <tr>
      <th>Grade</th>
      <th>Score Range</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>A</td><td>85-100</td><td>Excellent</td></tr>
    <tr><td>B</td><td>75-84</td><td>Very Good</td></tr>
    <tr><td>C</td><td>55-74</td><td>Good</td></tr>
    <tr><td>D</td><td>40-54</td><td>Average</td></tr>
    <tr><td>E</td><td>0-40</td><td>Needs Improvement</td></tr>
  </tbody>
</table>

<div class="section-title">ATTAINMNET GRADE</div>
<table>
  <thead>
    <tr>
      <th>Grade</th>
      <th>Score Range</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>A</td><td>50-40</td><td>Showing Excellent Effort</td></tr>
    <tr><td>B</td><td>30-35</td><td>Very Good Effort</td></tr>
    <tr><td>C</td><td>25-29</td><td>Needs More Concentrate and Application to Work</td></tr>
    <tr><td>D</td><td>20-24</td><td>Needs to be Motivated and Cooperative</td></tr>
    <tr><td>E</td><td>0-19</td><td>Needs to be Fully Looked After both at School and Home</td></tr>
  </tbody>
</table>

<BR>

<div class="signatures">

    <div class="sign">
        <img id="classTeacherSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Class Teacher’s Signature</div>
    </div>

    <div class="sign">
        <img id="proprietorSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Proprietor’s Signature</div>
    </div>

</div>

</body>
</html>
        `);
        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 400);
            printWindow.onafterprint = () => {
                printWindow.close();
                location.href = "result-list.html";
            };
        };

        setTimeout(() => { if (addSubjectBtn) addSubjectBtn.style.display = "inline-block"; }, 300);
    };
});

// ===============================
// PRINT EXAM RESULT
// ===============================
document.getElementById("PrintExamResult").addEventListener("click", () => {
    const modal = new bootstrap.Modal(document.getElementById("printConfirmModal"));
    modal.show();

    document.getElementById("confirmPrintBtn").onclick = () => {
        modal.hide();

        const addRowBtn = document.getElementById("addRow");
        if (addRowBtn) addRowBtn.style.display = "none";

        const table = document.getElementById("resultTable").cloneNode(true);

        // Function to get grade and remark based on score and max marks
        function getGradeAndRemark(score, max) {
            const percentage = (score / max) * 100;
            if (percentage >= 80) return { grade: 'A', remark: 'Excellent' };
            else if (percentage >= 70) return { grade: 'B', remark: 'Very Good' };
            else if (percentage >= 60) return { grade: 'C', remark: 'Good' };
            else if (percentage >= 50) return { grade: 'D', remark: 'Average' };
            else return { grade: 'E', remark: 'Needs Improvement' };
        }

        // Compute TOTAL (EXAM SCORE), GRADE, REMARK for each row
        table.querySelectorAll("tbody tr").forEach(tr => {
            // Assuming columns: 0:SL, 1:SUBJECT, 2:MARK OBTAINABLE (CA), 3:C.A 1, 4:C.A 2, 5:MARK OBTAINABLE (EXAM), 6:EXAM, 7:TOTAL, 8:GRADE, 9:REMARK, 10:ACTION
            const exam = parseFloat(tr.children[6].querySelector("input")?.value) || 0;
            tr.children[7].textContent = exam; // TOTAL = EXAM SCORE
            const { grade, remark } = getGradeAndRemark(exam, 100); // EXAM out of 100
            tr.children[8].textContent = grade; // GRADE
            tr.children[9].textContent = remark; // REMARK
        });

        // HIDE COLUMNS: C.A 1, C.A 2, MARK OBTAINABLE (CA), ACTION
        // SHOW TOTAL, GRADE, REMARK
        table.querySelectorAll("thead th").forEach((th, i) => {
            const t = th.textContent.toLowerCase();
            if (
                t.includes("c.a") ||
                t.includes("ca1") ||
                t.includes("ca 1") ||
                t.includes("ca 2") ||
                t.includes("action") ||
                t.includes("(ca)")
            ) {
                th.style.display = "none";
                table.querySelectorAll("tbody tr").forEach(tr => {
                    if (tr.children[i]) tr.children[i].style.display = "none";
                });
            }
        });

        // REMOVE INPUT FIELDS
        table.querySelectorAll("input, select").forEach(el => {
            el.parentElement.textContent = el.value || "-";
        });

        // Get student info
    const studentName = document.getElementById("studentName").textContent.trim();
    const studentGender = document.getElementById("studentGender").textContent.trim();
    const studentClass = document.getElementById("studentClass").textContent.trim();
    const term = document.getElementById("studentTerm").value || document.getElementById("studentTerm").textContent.trim();
    const dateIssued = document.getElementById("dateIssued").textContent.trim();
    const sessionYear = document.getElementById("sessionYear")?.textContent.trim() || "2025/2026";
    const classRemark = document.getElementById("classTeacherRemark").value || "-";
    const headRemark = document.getElementById("headTeacherRemark").value || "-";
    const Neatness = document.getElementById("Neatness")?.value || "-";
    const Politeness = document.getElementById("Politeness")?.value || "-";
    const Punctuality = document.getElementById("Punctuality")?.value || "-";
    const Responsibility = document.getElementById("Responsibility")?.value || "-";
    const Leadership = document.getElementById("Leadership")?.value || "-";
    const Helping = document.getElementById("Helping")?.value || "-";
    const Honesty = document.getElementById("Honesty")?.value || "-";
    const Teamwork = document.getElementById("Teamwork")?.value || "-";
    const daysOpened = document.getElementById("daysOpened")?.value || "-";
    const daysPresent = document.getElementById("daysPresent")?.value || "-";
    const daysAbsent = document.getElementById("daysAbsent")?.value || "-";
    const studentHeight = document.getElementById("studentHeight")?.value || "-";
    const studentWeight = document.getElementById("studentWeight")?.value || "-";
    const nextTermDate = document.getElementById("nextTermDate")?.value || "-";

     // Calculate total and average
const totals = Array.from(resultTable.querySelectorAll(".total-score")).map(td => parseInt(td.textContent) || 0);
const totalScore = totals.reduce((a, b) => a + b, 0);
const avgScore = totals.length ? (totalScore / totals.length).toFixed(2) : "0.00";

// -----------------------------
// Set Head Teacher Remark dynamically
// -----------------------------
let headRemarkAuto = "-";

if (avgScore >= 75) headRemarkAuto = "Outstanding achievement! Keep up the excellent work and continue striving for success.";
else if (avgScore >= 60) headRemarkAuto = "Very good performance. Well done! Maintain this effort to reach higher goals.";
else if (avgScore >= 50) headRemarkAuto = "Good performance. Keep working consistently to improve further.";
else if (avgScore >= 40) headRemarkAuto = "Satisfactory performance. There is room for improvement with more focus and effort.";
else headRemarkAuto = "Performance needs attention. Extra effort and dedication are recommended to improve in the next term.";


// Update the readonly textarea in your HTML
document.getElementById("headTeacherRemark").value = headRemarkAuto;


        // Build print window
        const printWindow = window.open("", "_blank", "width=900,height=1000");
        printWindow.document.open();
        printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Exam Result - Parakletos International School</title>
<style>
  body {
    font-family: "Segoe UI", "Calibri", sans-serif;
    background: #fff;
    color: #1c1c1c;
    margin: 30px;
    line-height: 1.6;
    position: relative;
  }

  /* Watermark */
  body::before {
    content: "";
    position: fixed;
    top: 50%;
    left: 50%;
    width: 700px;
    height: 700px;
    background: url('assets/images/auth/para logo.jpeg') no-repeat center center;
    background-size: 50%;
    opacity: 0.05;
    transform: translate(-50%, -50%);
    z-index: -1;
  }

  .school-logo {
    width: 180px;            /* bigger logo */
    height: auto;
    display: block;
    margin: 10px auto;
    border: 4px solid #c8102e;
    border-radius: 15px;
    padding: 6px;
    box-shadow: 0 5px 12px rgba(0,0,0,0.25);
    transform: scale(1.1);   /* prevents shrinking */
  }

  .header {
    text-align: center;
    margin-bottom: 35px;
    position: relative;
  }

  .header img { width: 100px; margin-bottom: 10px; }
  .header h3 {font-size: 26px;         /* larger bold heading */
    font-weight: 900;        /* heavy bold */
    color: #c8102e;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3); /* makes it stand out */
    margin-top: 5px; }

  .header p { margin: 2px 0; font-size: 13px; }

  .header::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 3px;
    background: linear-gradient(to right, #c8102e, #000);
    border-radius: 5px;
  }

  .row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 25px; }
  .col {
    flex: 1; min-width: 250px; background: #fff;
    border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    padding: 15px 20px;
  }
  .col h4 { margin-bottom: 8px; font-size: 14px; text-transform: uppercase; color: #fff; background: #c8102e; padding: 5px 10px; border-radius: 5px 5px 0 0; }
  .col ul { list-style: none; padding: 10px 0 0 0; margin: 0; }
  .col ul li { margin: 4px 0; font-size: 13px; }
  .col ul li strong { color: #c8102e; }

  table {
    width: 100%; border-collapse: collapse; margin-bottom: 25px;
    background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  th {
    background: #c8102e; color: #fff; padding: 8px; font-size: 13px; text-align: center;
  }
  td {
    text-align: center; padding: 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px;
  }
  tr:nth-child(even) td { background: #fdfdfd; }
  .grade-tick { color: #c8102e; font-size: 16px; }

  .section-title {
    font-weight: 700; margin: 25px 0 10px 0; font-size: 16px;
    color: #c8102e; text-transform: uppercase; letter-spacing: 0.5px;
    border-left: 5px solid #c8102e; padding-left: 10px;
  }

  .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
  .sign {
    border-top: 2px solid #c8102e; width: 45%; text-align: center;
    padding-top: 8px; font-size: 13px; color: #1c1c1c; font-weight: 600;
  }
  .signature-img {
    width: 80px;
    height: auto;
    display: block;
    margin: 0 auto 5px auto;
    opacity: 0.9;
  }
  .signature-title {
    font-size: 13px;
    font-weight: bold;
    margin-top: 2px;
  }

  @media print {
    body { background: #fff; -webkit-print-color-adjust: exact; }
    @page { size: A4; margin: 1cm; }
  }

  @media print {
  .school-logo {
    transform: scale(1.3) !important; /* boost size in print */
  }

  .header h3 {
    font-size: 30px !important;       /* bigger in print */
    font-weight: 900 !important;
  }

  @page {
    size: A4;
    margin: 0.5cm;
  }
}


  #resultTable td:nth-child(2),
  #resultTable th:nth-child(2),
  #resultTableBody input[name="subject"],
  #resultTableBody select[name="subject"] {
    text-transform: uppercase !important;
  }

</style>
</head>
<body>

<div class="header">
  <img src="assets/images/auth/para logo.jpeg" alt="School Logo">
  <br>
  <h3>Parakletos International School</h3>
  <p>No 2 Bisi Bankole Street Oke Onitea Osogbo</p>
  <p>EMAIL: parakletosschool2004@gmail.com</p>
  <p>NUMBERS: 08033881702</p>
</div>

<div class="row">
  <div class="col">
    <h4>Student Details</h4>
    <ul>
      <li><strong>Name:</strong> ${studentName}</li>
      <li><strong>Gender:</strong> ${studentGender}</li>
      <li><strong>Class:</strong> ${studentClass}</li>
      <li><strong>Term:</strong> ${term}</li>
      <li><strong>Student ID:</strong> ${studentID}</li>
      <li><strong>Date Issued:</strong> ${dateIssued}</li>
    </ul>
  </div>
  <div class="col">
    <h4>Attendance & Physical Record</h4>
    <ul>
      <li><strong>Days Opened:</strong> ${daysOpened}</li>
      <li><strong>Days Present:</strong> ${daysPresent}</li>
      <li><strong>Days Absent:</strong> ${daysAbsent}</li>
      <li><strong>Height:</strong> ${studentHeight} cm</li>
      <li><strong>Weight:</strong> ${studentWeight} kg</li>
      <li><strong>Next Term Begins:</strong> ${nextTermDate}</li>
    </ul>
  </div>
</div>

<div>
  <h4>Exam Results</h4>
  ${table.outerHTML}
</div>

<div class="row">
  <div class="col">
    <h4>Total Average Score</h4>
    <ul>
      <li><strong>Total Marks:</strong> ${totalScore}</li>
      <li><strong>Average Percentage:</strong> ${avgScore}%</li>
    </ul>
  </div>

  <div class="col">
    <h4>Remarks</h4>
    <ul>
      <li><strong>Class Teacher:</strong> ${classRemark}</li>
      <li><strong>Head Teacher:</strong> ${headRemarkAuto}</li>
    </ul>
  </div>
</div>

<div class="section-title">Affective & Psychomotor Domain (A - E)</div>
<table>
  <thead>
    <tr>
      <th>Area</th>
      <th>A</th>
      <th>B</th>
      <th>C</th>
      <th>D</th>
      <th>E</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Neatness</td>
      <td class="grade-tick">${Neatness=='A'?'✔️':''}</td>
      <td class="grade-tick">${Neatness=='B'?'✔️':''}</td>
      <td class="grade-tick">${Neatness=='C'?'✔️':''}</td>
      <td class="grade-tick">${Neatness=='D'?'✔️':''}</td>
      <td class="grade-tick">${Neatness=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Politeness</td>
      <td class="grade-tick">${Politeness=='A'?'✔️':''}</td>
      <td class="grade-tick">${Politeness=='B'?'✔️':''}</td>
      <td class="grade-tick">${Politeness=='C'?'✔️':''}</td>
      <td class="grade-tick">${Politeness=='D'?'✔️':''}</td>
      <td class="grade-tick">${Politeness=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Punctuality</td>
      <td class="grade-tick">${Punctuality=='A'?'✔️':''}</td>
      <td class="grade-tick">${Punctuality=='B'?'✔️':''}</td>
      <td class="grade-tick">${Punctuality=='C'?'✔️':''}</td>
      <td class="grade-tick">${Punctuality=='D'?'✔️':''}</td>
      <td class="grade-tick">${Punctuality=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Responsibility</td>
      <td class="grade-tick">${Responsibility=='A'?'✔️':''}</td>
      <td class="grade-tick">${Responsibility=='B'?'✔️':''}</td>
      <td class="grade-tick">${Responsibility=='C'?'✔️':''}</td>
      <td class="grade-tick">${Responsibility=='D'?'✔️':''}</td>
      <td class="grade-tick">${Responsibility=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Teamwork</td>
      <td class="grade-tick">${Teamwork=='A'?'✔️':''}</td>
      <td class="grade-tick">${Teamwork=='B'?'✔️':''}</td>
      <td class="grade-tick">${Teamwork=='C'?'✔️':''}</td>
      <td class="grade-tick">${Teamwork=='D'?'✔️':''}</td>
      <td class="grade-tick">${Teamwork=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Leadership</td>
      <td class="grade-tick">${Leadership=='A'?'✔️':''}</td>
      <td class="grade-tick">${Leadership=='B'?'✔️':''}</td>
      <td class="grade-tick">${Leadership=='C'?'✔️':''}</td>
      <td class="grade-tick">${Leadership=='D'?'✔️':''}</td>
      <td class="grade-tick">${Leadership=='E'?'✔️':''}</td>
    </tr>
    <tr>
      <td>Helping Others</td>
      <td class="grade-tick">${Helping=='A'?'✔️':''}</td>
      <td class="grade-tick">${Helping=='B'?'✔️':''}</td>
      <td class="grade-tick">${Helping=='C'?'✔️':''}</td>
      <td class="grade-tick">${Helping=='D'?'✔️':''}</td>
      <td class="grade-tick">${Helping=='E'?'✔️':''}</td>
    </tr>
  </tbody>
</table>


<BR>

<div class="section-title">System Grading</div>
<table>
  <thead>
    <tr>
      <th>Grade</th>
      <th>Score Range</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>A</td><td>85-100</td><td>Excellent</td></tr>
    <tr><td>B</td><td>75-84</td><td>Very Good</td></tr>
    <tr><td>C</td><td>55-74</td><td>Good</td></tr>
    <tr><td>D</td><td>40-54</td><td>Average</td></tr>
    <tr><td>E</td><td>0-40</td><td>Needs Improvement</td></tr>
  </tbody>
</table>

<div class="section-title">ATTAINMNET GRADE</div>
<table>
  <thead>
    <tr>
      <th>Grade</th>
      <th>Score Range</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>A</td><td>A</td><td>Showing Excellent Effort</td></tr>
    <tr><td>B</td><td>B</td><td>Very Good Effort</td></tr>
    <tr><td>C</td><td>C</td><td>Needs More Concentrate and Application to Work</td></tr>
    <tr><td>D</td><td>D</td><td>Needs to be Motivated and Cooperative</td></tr>
    <tr><td>E</td><td>E</td><td>Needs to be Fully Looked After both at School and Home</td></tr>
  </tbody>
</table>

<BR>

<div class="signatures">

    <div class="sign">
        <img id="classTeacherSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Class Teacher’s Signature</div>
    </div>

    <div class="sign">
        <img id="proprietorSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Proprietor’s Signature</div>
    </div>

</div>
</body>
</html>
        `);
        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 400);
            printWindow.onafterprint = () => {
                printWindow.close();
                location.href = "result-list.html";
            };
        };

        setTimeout(() => { if (addRowBtn) addRowBtn.style.display = "inline-block"; }, 300);
    };
});


// ---------------------------
// Global Variables
// ---------------------------
let studentName = "";
let studentGender = "";
let studentClass = "";
let sessionYear = "";
let term = "Yearly Summary";
let avgScore = 0;
let totalScoreValue = 0;
let promotionStatus = "";

// ---------------------------
// Print Result Function
// ---------------------------
document.getElementById("printButton").addEventListener("click", () => {
    studentName = document.getElementById("studentName")?.value || document.getElementById("studentName")?.textContent || "-";
    studentGender = document.getElementById("studentGender")?.value || document.getElementById("studentGender")?.textContent || "-";
    studentClass = document.getElementById("studentClass")?.value || document.getElementById("studentClass")?.textContent || "-";
    sessionYear = document.getElementById("sessionYear")?.value || document.getElementById("sessionYear")?.textContent || "-";
    promotionStatus = document.getElementById("promotionStatus")?.value || "-";
    
    const resultTable = document.getElementById("yearlySummaryTable").cloneNode(true);

    const printWindow = window.open("", "_blank", "width=900,height=1000");
    printWindow.document.open();
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Student Result | Damotak International School</title>
<style>
body { font-family: "Segoe UI", "Calibri", sans-serif; margin: 30px; line-height: 1.6; color: #2c3e50; position: relative; background: #f7f9fc; }
body::before { content: ""; position: fixed; top:50%; left:50%; width:750px; height:750px; background: url('assets/images/auth/Damotak Logo.png') no-repeat center center; background-size:60%; opacity:0.05; transform: translate(-50%, -50%); z-index:-1; }
.school-logo { border: 3px solid #0047AB; border-radius: 12px; padding: 5px; width: 150px; height:auto; display:block; margin:20px auto; box-shadow:0 4px 8px rgba(0,0,0,0.2); }
.header { text-align:center; margin-bottom:35px; position:relative; }
.header h3 { margin:5px 0; color:#1c3d72; text-transform:uppercase; letter-spacing:1px; }
.header p { margin:2px 0; font-size:13px; }
.header::after { content:""; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:80%; height:3px; background: linear-gradient(to right, #1c3d72, #2a4d69); border-radius:5px; }
.col h4, .col ul { text-transform: uppercase; }
.row { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:25px; }
.col { flex:1; min-width:250px; background:#fff; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.07); padding:15px 20px; }
.col h4 { margin-bottom:8px; font-size:14px; text-transform:uppercase; color:#fff; background:#1c3d72; padding:5px 10px; border-radius:5px 5px 0 0; }
.col ul { list-style:none; padding:10px 0 0 0; margin:0; }
.col ul li { margin:4px 0; font-size:13px; }
.col ul li strong { color:#1c3d72; }
table { width:100%; border-collapse:collapse; margin-bottom:25px; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.05); }
th { background:#1c3d72; color:#fff; padding:6px; font-size:13px; text-align:center; }
td { text-align:center; padding:6px; border-bottom:1px solid #eef2f7; font-size:13px; }
tr:nth-child(even) td { background:#f9fbff; }
.section-title { font-weight:700; margin:25px 0 10px 0; font-size:16px; color:#1c3d72; text-transform:uppercase; letter-spacing:0.5px; border-left:5px solid #1c3d72; padding-left:10px; }
.signatures { display:flex; justify-content:space-between; margin-top:40px; }
.sign { border-top:2px solid #1c3d72; width:45%; text-align:center; padding-top:8px; font-size:13px; color:#1c3d72; font-weight:600; }
@media print { body { background:#fff; -webkit-print-color-adjust: exact; } @page { size:A4; margin:1cm; } }
 .signatures {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
}

.sign {
    text-align: center;
}

.signature-img {
    width: 80px;
    height: auto;
    display: block;
    margin: 0 auto 5px auto; /* logo on top, small spacing */
    opacity: 0.9;
}

.signature-line {
    width: 150px;
    height: 2px;
    background: #000;
    margin: 0 auto 5px auto;
}

.signature-title {
    font-size: 13px;
    font-weight: bold;
}


</style>
</head>
<body>
<div class="header">
<img src="assets/images/auth/Damotak Logo.png" alt="School Logo" class="school-logo">
<h3>Damotak International School</h3>
<p>PRIMARY & JUNIOR SECONDARY : NEW OBA ROAD, ILE-IDANDE AREA, OKE-ONITEA</p>
<p>JUNIOR SECONDARY & SENIOR SECONDARY : OFF AYEKALE LAROTIMELIHINE,SCHEME. OSOGBO.</p>
<p>EMAIL: Damotakint@gmail.com </p>
<p>NUMBERS: 08033880730 | 08082870544 | 08132687701 </p>
<p><strong>Academic Session:</strong> ${sessionYear}</p>
</div>

<div class="row">
<div class="col">
<h4>Student Details</h4>
<ul>
<li><strong>Name:</strong> ${studentName}</li>
<li><strong>Gender:</strong> ${studentGender}</li>
<li><strong>Class:</strong> ${studentClass}</li>
<li><strong>Term:</strong> ${term}</li>
<li><strong>Student ID:</strong> ${studentID}</li>
<li><strong>Date Issued:</strong> ${new Date().toLocaleDateString()}</li>
</ul>
</div>
</div>

<div class="section-title">Subjects and Scores</div>
${resultTable.outerHTML}

<div class="row">
<div class="col">
<h4>Summary</h4>
<ul>
<li><strong>Total Marks:</strong> ${totalScoreValue}</li>
<li><strong>Average Score:</strong> ${avgScore}%</li>
</ul>
</div>
<div class="col">
<h4>Promotion Status</h4>
<ul>
<li><strong>Promotion Status:</strong> ${promotionStatus}</li>
</ul>
</div>
</div>

<div class="signatures">

    <div class="sign">
        <img id="classTeacherSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Class Teacher’s Signature</div>
    </div>

    <div class="sign">
        <img id="proprietorSignatureImg" class="signature-img">
        <div class="signature-line"></div>
        <div class="signature-title">Proprietor’s Signature</div>
    </div>

</div>

</body>
</html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
        const fileTitle = `${studentName.replace(/\s+/g, "_")}_${studentID}_Result`;
        printWindow.document.title = fileTitle;

        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1000);
        printWindow.onafterprint = printWindow.onbeforeunload = () => {
            printWindow.close();
            location.href = "result-add.html";
        };
    };
});

// ---------------------------
// Load Yearly Summary
// ---------------------------
async function loadYearlySummary() {
    yearlySummaryBody.innerHTML = "";
    const terms = ["First Term", "Second Term", "Third Term"];
    const termResults = {};
    let totalScore = 0;
    let subjectCount = 0;

    for (let t of terms) {
        const snapshot = await get(ref(resultDb, `Results/${studentID}/${studentClass}/${t}`));
        termResults[t] = snapshot.exists() ? snapshot.val().Subjects : {};
    }

    const subjectSet = new Set();
    terms.forEach(term => Object.keys(termResults[term] || {}).forEach(sub => subjectSet.add(sub.trim())));
    const allSubjects = Array.from(subjectSet);

    allSubjects.forEach((subjectKey, index) => {
        const firstTermSub = Object.keys(termResults["First Term"] || {}).find(s => s.trim() === subjectKey) || "";
        const secondTermSub = Object.keys(termResults["Second Term"] || {}).find(s => s.trim() === subjectKey) || "";
        const thirdTermSub = Object.keys(termResults["Third Term"] || {}).find(s => s.trim() === subjectKey) || "";

        const firstTerm = termResults["First Term"][firstTermSub]?.total || 0;
        const secondTerm = termResults["Second Term"][secondTermSub]?.total || 0;
        const thirdTerm = termResults["Third Term"][thirdTermSub]?.total || 0;

        const avgTotal = ((firstTerm + secondTerm + thirdTerm) / 3).toFixed(2);

        totalScore += parseFloat(avgTotal);
        subjectCount++;

        let grade, remark;
        if (avgTotal >= 70) { grade = "A"; remark = "Excellent"; }
        else if (avgTotal >= 60) { grade = "B"; remark = "Very Good"; }
        else if (avgTotal >= 50) { grade = "C"; remark = "Good"; }
        else if (avgTotal >= 40) { grade = "D"; remark = "Averge"; }
        else { grade = "F"; remark = "Fail"; }

        const row = document.createElement("tr");
        row.innerHTML = `<td>${index+1}</td><td>${subjectKey}</td><td>${firstTerm}</td><td>${secondTerm}</td><td>${thirdTerm}</td><td>${avgTotal}</td><td>${grade}</td><td>${remark}</td>`;
        yearlySummaryBody.appendChild(row);
    });

    if (allSubjects.length === 0) {
        yearlySummaryBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#d9534f;font-weight:bold;">ℹ️ No previous result found.</td></tr>`;
        return;
    }

    const overallAverage = (totalScore / subjectCount).toFixed(2);
    if (overallAverage >= 80) promotionStatus = "Promoted to the Next Class with Distinction";
    else if (overallAverage >= 50) promotionStatus = "Promoted to the Next Class";
    else if (overallAverage >= 40) promotionStatus = "Promotion on Trial";
    else promotionStatus = "Fail";

    totalScoreValue = totalScore;
    avgScore = overallAverage;
    document.getElementById("promotionStatus").value = promotionStatus;
}

// ---------------------------
// Save Yearly Summary
// ---------------------------
async function saveYearlySummary(studentID, currentClass) {
    const summaryData = {
        totalScore: totalScoreValue,
        averageScore: avgScore,
        promotionStatus: promotionStatus,
        savedAt: new Date().toISOString()
    };
    await set(ref(resultDb, `Results/${studentID}/${currentClass}/Yearly Summary`), summaryData);
    console.log("Yearly Summary saved successfully");
}

// ---------------------------
// Move to Next Class Button
// ---------------------------
document.getElementById("MoveNextSession").addEventListener("click", () => {
    const modal = new bootstrap.Modal(document.getElementById("moveNextClassModal"));
    modal.show();
});

// ---------------------------
// Confirm Move to Next Class
// ---------------------------
document.getElementById("confirmMoveNextBtn").addEventListener("click", async () => {
    const terms = ["First Term", "Second Term", "Third Term"];
    let allResultsComplete = true;
    const currentClass = document.getElementById("studentClass").textContent;

    for (let term of terms) {
        const snapshot = await get(ref(resultDb, `Results/${studentID}/${currentClass}/${term}`));
        if (!snapshot.exists()) { allResultsComplete = false; break; }
    }

    if (!allResultsComplete) {
        showNotification("⚠️ Complete ALL terms before moving to the next class.", false);
        return;
    }

    const nextClass = getNextClass(currentClass);
    await saveYearlySummary(studentID, currentClass);
    await createNewSession(studentID, nextClass);
    await set(ref(resultDb, `Results/${studentID}/currentClass`), nextClass);
    document.getElementById("studentClass").textContent = nextClass;

    yearlySummaryBody.innerHTML = "";
    totalScoreValue = 0; avgScore = 0; promotionStatus = "";
    const termTables = document.querySelectorAll(".term-table-body");
    termTables.forEach(tb => resetTermTable(tb));
    clearInputs();
    document.getElementById("termSelect").value = "First Term";
    document.getElementById("FirstTermTab").click();
    showNotification("✅ Student moved to the next class successfully! First term is ready for new input.", true);
});

// ---------------------------
// Create Next Class Structure
// ---------------------------
async function createNewSession(studentID, nextClass) {
    const basePath = `Results/${studentID}/${nextClass}`;
    const terms = ["First Term", "Second Term", "Third Term"];
    for (let term of terms) {
        await set(ref(resultDb, `${basePath}/${term}/Subjects`), {});
        await set(ref(resultDb, `${basePath}/${term}/Affective`), {});
        await set(ref(resultDb, `${basePath}/${term}/Remarks`), "");
    }
    await set(ref(resultDb, `${basePath}/Yearly Summary`), {});
}

// ---------------------------
// Load Current Class
// ---------------------------
async function loadCurrentClass(studentID) {
    try {
        const studentSnap = await get(ref(studentDb, `Students/${studentID}`));
        let currentClass = "Unknown";

        if (studentSnap.exists()) {
            const studentData = studentSnap.val();
            currentClass = studentData.studentClass || studentData.className || "Unknown";
            await set(ref(resultDb, `Results/${studentID}/currentClass`), currentClass);
            document.getElementById("studentName").textContent = studentData.name || "Unknown";
            document.getElementById("studentGender").textContent = studentData.gender || "Unknown";
            document.getElementById("studentClass").textContent = currentClass;
        }

        const yearlySnap = await get(ref(resultDb, `Results/${studentID}/${currentClass}/Yearly Summary`));
        if (yearlySnap.exists()) {
            const d = yearlySnap.val();
            totalScoreValue = d.totalScore || 0;
            avgScore = d.averageScore || 0;
            promotionStatus = d.promotionStatus || "";
            document.getElementById("promotionStatus").value = promotionStatus;
        } else yearlySummaryBody.innerHTML = "";
    } catch (err) {
        console.error("Failed to load student class info:", err);
        document.getElementById("studentName").textContent = "Unknown";
        document.getElementById("studentGender").textContent = "Unknown";
        document.getElementById("studentClass").textContent = "Unknown";
    }
}
loadCurrentClass(studentID);

// ---------------------------
// Clear Inputs
// ---------------------------
function clearInputs() {
    const inputs = document.querySelectorAll("input[type='text'], input[type='number'], select");
    inputs.forEach(input => input.value = "");
}

// ---------------------------
// Get Next Class
// ---------------------------
function getNextClass(currentClass) {
    const classes = ["preNursery","nursery 1","nursery 2","Prep-Grade","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"];
    const index = classes.indexOf(currentClass);
    if (index >= 0 && index < classes.length - 1) return classes[index+1];
    if (index === classes.length - 1) return "Graduate";
    return currentClass;
}

// ---------------------------
// Navigation Buttons
// ---------------------------
document.getElementById("backBtn").addEventListener("click", () => window.location.href = "result-list.html");

window.addEventListener("DOMContentLoaded", () => loadCurrentClass(studentID));