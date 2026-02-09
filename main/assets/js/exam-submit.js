import { getDatabase, ref, get, set, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const db = getDatabase();

const studentId = sessionStorage.getItem("studentKey");
const studentName = sessionStorage.getItem("studentName");

// ================= SAVE RESULT =================
async function saveExamResult(examId, subject, studentAnswers) {

  const qSnap = await get(ref(db, `Exam/${examId}/questions`));
  if (!qSnap.exists()) return;

  const questions = qSnap.val();
  const totalQuestions = Object.keys(questions).length;

  let correct = 0;
  let wrong = 0;

  Object.keys(questions).forEach(qId => {
    const correctAns = questions[qId].correctAnswer;
    const studentAns = studentAnswers[qId];

    if (!studentAns) return;
    if (studentAns === correctAns) correct++;
    else wrong++;
  });

  const passMark = Math.ceil(totalQuestions / 2);
  const status = correct >= passMark ? "PASS" : "FAIL";

  const resultData = {
    studentName,
    subject,
    totalQuestions,
    correctCount: correct,
    wrongCount: wrong,
    score: correct,
    status,
    submittedAt: serverTimestamp(),
    answers: studentAnswers
  };

  await set(
    ref(db, `ExamResults/${examId}/${studentId}`),
    resultData
  );
}
