const student = JSON.parse(sessionStorage.getItem("studentData"));
const resultData = JSON.parse(sessionStorage.getItem("resultData"));
const term = sessionStorage.getItem("selectedTerm");

if(!student || !resultData){ 
  alert("No result found. Please login."); 
  window.location.href="parnet-login.html"; 
} else {
  document.getElementById("sessionYear").textContent = resultData.sessionYear || "-";

  // Student Details
  const studentDetails = [
    {label:"Name", value: student.name},
    {label:"Gender", value: student.gender || "-"},
    {label:"Class", value: student.studentClass || "-"},
    {label:"Term", value: term},
    {label:"Student ID", value: student.studentID},
    {label:"Date Issued", value: resultData.dateIssued || "-"}
  ];
  const detailsUl = document.getElementById("studentDetails");
  studentDetails.forEach(d=>{
    const li=document.createElement("li"); 
    li.innerHTML=`<strong>${d.label}:</strong> ${d.value}`;
    detailsUl.appendChild(li); 
  });

  // Attendance
  const attendance = [
    {label:"Days Opened", value: resultData.daysOpened || "-"},
    {label:"Days Present", value: resultData.daysPresent || "-"},
    {label:"Days Absent", value: resultData.daysAbsent || "-"},
    {label:"Height", value: resultData.studentHeight || "-"},
    {label:"Weight", value: resultData.studentWeight || "-"},
    {label:"Next Term Begins", value: resultData.nextTermDate || "-"}
  ];
  const attendanceUl = document.getElementById("attendanceDetails");
  attendance.forEach(a=>{
    const li=document.createElement("li"); 
    li.innerHTML=`<strong>${a.label}:</strong> ${a.value}`;
    attendanceUl.appendChild(li); 
  });

  // Signatures
  document.getElementById("classTeacherSignatureImg").src = resultData.classTeacherSignature || "assets/images/auth/Princpal Signature.jpeg";
  document.getElementById("proprietorSignatureImg").src = resultData.headTeacherSignature || "assets/images/auth/School Stamp.jpeg";

 // Subjects
let index=1, totals=[];
for(const subject in resultData.Subjects){
  const s=resultData.Subjects[subject];
  const ca1=+s.ca1||0, ca2=+s.ca2||0, exam=+s.exam||0;
  const total=+s.total||ca1+ca2+exam;
  totals.push(total);

  resultTableBody.innerHTML+=`
  <tr>
    <td>${index++}</td>
    <td>${subject}</td>
    <td>${ca1}</td>
    <td>${ca2}</td>
    <td>${exam}</td>
    <td>${total}</td>
    <td>${s.grade||"-"}</td>
    <td>${s.remark||"-"}</td>
  </tr>`;
}

  // Calculate total and average
  const totalScore = totals.reduce((a,b)=>a+b,0);
  const avgScore = totals.length ? (totalScore / totals.length).toFixed(2) : 0;
  document.getElementById("totalMarks").textContent = totalScore;
  document.getElementById("averageScore").textContent = avgScore;

  // Class Teacher Remark
  document.getElementById("classTeacherRemark").textContent = resultData.classTeacherRemark || "-";

  // Head Teacher / Proprietor Remark dynamically (must come AFTER avgScore is calculated)
  let headRemarkAuto = "-";
  if(avgScore >= 75) headRemarkAuto = "Outstanding achievement! Keep up the excellent work and continue striving for success.";
  else if(avgScore >= 60) headRemarkAuto = "Very good performance. Well done! Maintain this effort to reach higher goals.";
  else if(avgScore >= 50) headRemarkAuto = "Good performance. Keep working consistently to improve further.";
  else if(avgScore >= 40) headRemarkAuto = "Satisfactory performance. There is room for improvement with more focus and effort.";
  else headRemarkAuto = "Performance needs attention. Extra effort and dedication are recommended to improve in the next term.";

  document.getElementById("headTeacherRemark").textContent = headRemarkAuto;

  // Affective
  const affectiveAreas = ["Neatness","Politeness","Punctuality","Responsibility","Teamwork","Leadership","Helping"];
  const affectiveBody = document.getElementById("affectiveBody");
  affectiveAreas.forEach(area=>{
    const grade = resultData[area] || "-";
    const tr = document.createElement("tr");
    tr.innerHTML=`<td>${area}</td>
      <td class="grade-tick">${grade=='A'?'✔️':''}</td>
      <td class="grade-tick">${grade=='B'?'✔️':''}</td>
      <td class="grade-tick">${grade=='C'?'✔️':''}</td>
      <td class="grade-tick">${grade=='D'?'✔️':''}</td>
      <td class="grade-tick">${grade=='E'?'✔️':''}</td>`;
    affectiveBody.appendChild(tr);
  });
}

// Logout
document.getElementById("logoutBtn").addEventListener("click",()=>{
  sessionStorage.clear();
  window.location.href="parnet-login.html";
});
