import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

  // ✅ Firebase Configurations
  const databases = {
    classes: {
      config: {
        apiKey: "AIzaSyB-Oh8Ux2EGY_fQLzPhnNnXBjsuN8Ojw-8",
  authDomain: "parakletos-subjects.firebaseapp.com",
  projectId: "parakletos-subjects",
  storageBucket: "parakletos-subjects.firebasestorage.app",
  messagingSenderId: "186963551802",
  appId: "1:186963551802:web:9e4a400b9fe911a7dcf703"
      },
      node: "Classes"
    },
    students: {
      config: {
         apiKey: "AIzaSyBZMWQcbpd7_dC9qS_C3QWk0P8xT5c8050",
  authDomain: "parakletos-students.firebaseapp.com",
  projectId: "parakletos-students",
  storageBucket: "parakletos-students.firebasestorage.app",
  messagingSenderId: "388683135152",
  appId: "1:388683135152:web:e0200e0b5042e329c36375"
      },
      node: "Students"
    },
    staff: {
      config: {
        apiKey: "AIzaSyCI7CJ1xb6q2Rll-3AxikmYGrNO1buL4vQ",
  authDomain: "parakletos-database.firebaseapp.com",
  projectId: "parakletos-database",
  storageBucket: "parakletos-database.firebasestorage.app",
  messagingSenderId: "613062536180",
  appId: "1:613062536180:web:f3f4fef7409e69d05d67a1"
      },
      node: "Staffs"
    }
  };

  // ✅ Initialize Firebase Apps
  const classApp = initializeApp(databases.classes.config, "classApp");
  const studentApp = initializeApp(databases.students.config, "studentApp");
  const staffApp = initializeApp(databases.staff.config, "staffApp");

  const classDB = getDatabase(classApp);
  const studentDB = getDatabase(studentApp);
  const staffDB = getDatabase(staffApp);

  // ✅ Get DOM Elements
  const classCount = document.getElementById("classCount");
  const studentCount = document.getElementById("studentCount");
  const staffCount = document.getElementById("staffCount");
  const resultCount = document.getElementById("resultCount");

  // ✅ Real-time Listeners
  onValue(ref(classDB, "Classes"), (snapshot) => {
    classCount.textContent = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
  });

  onValue(ref(studentDB, "Students"), (snapshot) => {
    if (snapshot.exists()) {
      const students = Object.values(snapshot.val());
      const active = students.filter(s => s.status === "Active" || s.active === true).length;
      studentCount.textContent = active;
      resultCount.textContent = active; // ✅ Results = number of active students
    } else {
      studentCount.textContent = 0;
      resultCount.textContent = 0;
    }
  });

  onValue(ref(staffDB, "Staffs"), (snapshot) => {
    if (snapshot.exists()) {
      const staff = Object.values(snapshot.val());
      const active = staff.filter(s => s.status === "Active" || s.active === true).length;
      staffCount.textContent = active;
    } else {
      staffCount.textContent = 0;
    }
  });