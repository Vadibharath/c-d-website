/* ===================================================================
   STUDENT ATTENDANCE TRACKER - APPLICATION LOGIC & STATE ENGINE
   =================================================================== */

// Initial Institutional Dataset
const DEFAULT_COURSES = [
  { code: "CS301", name: "Software Engineering & System Design", faculty: "Dr. K. Sharma (SESD Lead)" },
  { code: "CS201", name: "Data Structures & Algorithms", faculty: "Prof. Umender" },
  { code: "CS302", name: "Web Technologies", faculty: "Prof. Vamshi" },
  { code: "CS303", name: "Database Management Systems", faculty: "Prof. Jagan" }
];

const DEFAULT_STUDENTS = [
  { id: "23CS01", name: "Vamshi", email: "vamshi@student.edu", avatar: "VM", color: "#0969da" },
  { id: "23CS02", name: "Eswar", email: "eswar@student.edu", avatar: "ES", color: "#2da44e" },
  { id: "23CS03", name: "Rishikesh", email: "rishikesh@student.edu", avatar: "RK", color: "#bf8700" },
  { id: "23CS04", name: "Nithish", email: "nithish@student.edu", avatar: "NT", color: "#bf3989" },
  { id: "23CS05", name: "Bharath", email: "bharath@student.edu", avatar: "BH", color: "#1f6feb" },
  { id: "23CS06", name: "Manukanta", email: "manukanta@student.edu", avatar: "MK", color: "#238636" },
  { id: "23CS07", name: "Umender", email: "umender@student.edu", avatar: "UM", color: "#d29922" },
  { id: "23CS08", name: "Jagan", email: "jagan@student.edu", avatar: "JG", color: "#da3633" },
  { id: "23CS09", name: "Sai Ram", email: "sairam@student.edu", avatar: "SR", color: "#8957e5" }
];

// Seed Attendance Records for historical analytics
function getInitialAttendance() {
  const dates = ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"];
  const slots = ["Morning Slot (09:30 AM)", "Afternoon Slot (02:00 PM)"];
  const records = [];

  dates.forEach(date => {
    DEFAULT_COURSES.forEach(course => {
      slots.forEach(slot => {
        const studentMap = {};
        DEFAULT_STUDENTS.forEach(student => {
          // Give diverse realistic attendance (some high, some moderate, one or two under 75% for alerts)
          let isPresent = true;
          if (student.name === "Sai Ram" && (date === "2026-10-10" || date === "2026-10-11" || date === "2026-10-12")) {
            isPresent = false; // Under 75%
          } else if (student.name === "Jagan" && (date === "2026-10-09" || date === "2026-10-11")) {
            isPresent = false;
          } else if (student.name === "Manukanta" && (date === "2026-10-08" && slot.includes("Afternoon"))) {
            isPresent = false;
          }
          studentMap[student.id] = isPresent ? "Present" : "Absent";
        });

        records.push({
          id: `REC-${date}-${course.code}-${slot.substring(0,3)}`,
          courseCode: course.code,
          courseName: course.name,
          date: date,
          slot: slot,
          faculty: course.faculty,
          records: studentMap,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
  return records;
}

// Initial Notifications
const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "alert-shortage",
    title: "Low Attendance Warning (<75%)",
    message: "Student Sai Ram has fallen below the 75% minimum threshold in CS301 (SESD). Current attendance: 70%.",
    time: "10 mins ago",
    read: false,
    icon: "⚠️"
  },
  {
    id: "notif-2",
    type: "update",
    title: "Attendance Recorded for CS301",
    message: "Dr. K. Sharma marked attendance for Software Engineering & System Design (Morning Slot).",
    time: "1 hour ago",
    read: false,
    icon: "📋"
  },
  {
    id: "notif-3",
    type: "correction",
    title: "Attendance Record Rectified",
    message: "Faculty updated attendance entry for 2026-10-10 afternoon session for student Vamshi.",
    time: "Yesterday",
    read: true,
    icon: "🔄"
  }
];

// App State Manager
class AttendanceApp {
  constructor() {
    this.courses = DEFAULT_COURSES;
    this.students = DEFAULT_STUDENTS;
    
    // Load from localStorage or initialize defaults
    this.attendanceRecords = JSON.parse(localStorage.getItem("sesd_attendance_records")) || getInitialAttendance();
    this.notifications = JSON.parse(localStorage.getItem("sesd_notifications")) || DEFAULT_NOTIFICATIONS;
    
    // Current Active User
    this.currentUser = {
      role: "faculty", // 'faculty' or 'student'
      name: "Dr. K. Sharma",
      email: "sharma@attendance.edu",
      studentId: null
    };

    // Active Marking Draft
    this.currentMarking = {
      courseCode: "CS301",
      date: new Date().toISOString().split("T")[0],
      slot: "Morning Slot (09:30 AM)",
      roster: {}
    };

    this.init();
  }

  init() {
    this.initMarkingRoster();
    this.bindEvents();
    this.renderMarkingRoster();
    this.renderReports();
    this.renderNotifications();
    this.updateNotificationBadge();
    this.renderShowcasePage(1);
  }

  saveState() {
    localStorage.setItem("sesd_attendance_records", JSON.stringify(this.attendanceRecords));
    localStorage.setItem("sesd_notifications", JSON.stringify(this.notifications));
  }

  initMarkingRoster() {
    this.students.forEach(s => {
      this.currentMarking.roster[s.id] = "Present";
    });
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll(".nav-pill").forEach(pill => {
      pill.addEventListener("click", (e) => {
        const tab = e.currentTarget.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    // Role switcher
    const roleToggle = document.getElementById("roleSwitcherBtn");
    if (roleToggle) {
      roleToggle.addEventListener("click", () => this.toggleUserRole());
    }

    // Marking selectors
    const courseSelect = document.getElementById("markingCourseSelect");
    if (courseSelect) {
      courseSelect.addEventListener("change", (e) => {
        this.currentMarking.courseCode = e.target.value;
      });
    }

    const dateSelect = document.getElementById("markingDateInput");
    if (dateSelect) {
      dateSelect.value = this.currentMarking.date;
      dateSelect.addEventListener("change", (e) => {
        this.currentMarking.date = e.target.value;
      });
    }

    const slotSelect = document.getElementById("markingSlotSelect");
    if (slotSelect) {
      slotSelect.addEventListener("change", (e) => {
        this.currentMarking.slot = e.target.value;
      });
    }

    // Quick Marking Actions
    const btnAllPresent = document.getElementById("btnMarkAllPresent");
    if (btnAllPresent) {
      btnAllPresent.addEventListener("click", () => {
        this.students.forEach(s => this.currentMarking.roster[s.id] = "Present");
        this.renderMarkingRoster();
        this.showToast("All students marked Present", "success");
      });
    }

    const btnAllAbsent = document.getElementById("btnMarkAllAbsent");
    if (btnAllAbsent) {
      btnAllAbsent.addEventListener("click", () => {
        this.students.forEach(s => this.currentMarking.roster[s.id] = "Absent");
        this.renderMarkingRoster();
        this.showToast("All students marked Absent", "warning");
      });
    }

    // Save Attendance Button
    const btnSaveAttendance = document.getElementById("btnSaveAttendance");
    if (btnSaveAttendance) {
      btnSaveAttendance.addEventListener("click", () => this.handleSaveAttendance());
    }

    // Filter events in Reports
    const reportCourseFilter = document.getElementById("reportCourseFilter");
    if (reportCourseFilter) {
      reportCourseFilter.addEventListener("change", () => this.renderReports());
    }

    const reportStudentFilter = document.getElementById("reportStudentFilter");
    if (reportStudentFilter) {
      reportStudentFilter.addEventListener("change", () => this.renderReports());
    }

    const reportSearch = document.getElementById("reportSearchInput");
    if (reportSearch) {
      reportSearch.addEventListener("input", () => this.renderReports());
    }

    // Export CSV
    const btnExportCSV = document.getElementById("btnExportCSV");
    if (btnExportCSV) {
      btnExportCSV.addEventListener("click", () => this.exportReportsCSV());
    }

    // Notification dropdown / view actions
    const notifTrigger = document.getElementById("notificationTrigger");
    if (notifTrigger) {
      notifTrigger.addEventListener("click", () => {
        this.switchTab("notifications");
      });
    }

    const btnMarkAllRead = document.getElementById("btnMarkAllRead");
    if (btnMarkAllRead) {
      btnMarkAllRead.addEventListener("click", () => {
        this.notifications.forEach(n => n.read = true);
        this.saveState();
        this.renderNotifications();
        this.updateNotificationBadge();
        this.showToast("All notifications marked as read", "info");
      });
    }

    // Assignment Showcase Navigation
    document.querySelectorAll(".showcase-step-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const page = parseInt(e.currentTarget.getAttribute("data-page"));
        this.renderShowcasePage(page);
      });
    });
  }

  switchTab(tabId) {
    document.querySelectorAll(".nav-pill").forEach(p => p.classList.remove("active"));
    const activePill = document.querySelector(`.nav-pill[data-tab="${tabId}"]`);
    if (activePill) activePill.classList.add("active");

    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
    const activePane = document.getElementById(`tab-${tabId}`);
    if (activePane) activePane.classList.add("active");

    if (tabId === "reports") {
      this.renderReports();
    } else if (tabId === "notifications") {
      this.renderNotifications();
    }
  }

  toggleUserRole() {
    if (this.currentUser.role === "faculty") {
      this.currentUser = {
        role: "student",
        name: "Vamshi",
        email: "vamshi@student.edu",
        studentId: "23CS01"
      };
      this.showToast("Switched to Student Role (Vamshi)", "info");
    } else {
      this.currentUser = {
        role: "faculty",
        name: "Dr. K. Sharma",
        email: "sharma@attendance.edu",
        studentId: null
      };
      this.showToast("Switched to Faculty Role (Dr. K. Sharma)", "info");
    }
    this.updateUserBadge();
    this.renderReports();
  }

  updateUserBadge() {
    const avatar = document.getElementById("userAvatarBadge");
    const name = document.getElementById("userNameBadge");
    const role = document.getElementById("userRoleBadge");
    if (avatar && name && role) {
      if (this.currentUser.role === "faculty") {
        avatar.textContent = "KS";
        avatar.style.background = "linear-gradient(135deg, #3b82f6, #1d4ed8)";
        name.textContent = this.currentUser.name;
        role.textContent = "Faculty · Authorized";
      } else {
        avatar.textContent = "VM";
        avatar.style.background = "linear-gradient(135deg, #10b981, #047857)";
        name.textContent = this.currentUser.name;
        role.textContent = `Student · Roll ${this.currentUser.studentId}`;
      }
    }
  }

  renderMarkingRoster() {
    const container = document.getElementById("markingRosterBody");
    if (!container) return;

    let html = "";
    this.students.forEach(student => {
      const status = this.currentMarking.roster[student.id] || "Present";
      const isPresent = status === "Present";

      html += `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="user-avatar" style="background:${student.color};">${student.avatar}</div>
              <div>
                <strong style="color:var(--text-main); font-size:14px;">${student.name}</strong>
                <div style="font-size:11px; color:var(--text-dim);">${student.email}</div>
              </div>
            </div>
          </td>
          <td><span style="font-family:'JetBrains Mono', monospace; font-weight:600; color:var(--primary);">${student.id}</span></td>
          <td>
            <div class="status-toggle">
              <button type="button" class="status-toggle-btn ${isPresent ? 'active present' : ''}" 
                onclick="window.attendanceApp.toggleStudentStatus('${student.id}', 'Present')">
                ✓ Present
              </button>
              <button type="button" class="status-toggle-btn ${!isPresent ? 'active absent' : ''}" 
                onclick="window.attendanceApp.toggleStudentStatus('${student.id}', 'Absent')">
                ✗ Absent
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    container.innerHTML = html;
  }

  toggleStudentStatus(studentId, status) {
    this.currentMarking.roster[studentId] = status;
    this.renderMarkingRoster();
  }

  // Duplicate attendance check & save handler
  handleSaveAttendance() {
    if (this.currentUser.role !== "faculty") {
      this.showToast("Only authorized faculty can mark attendance!", "danger");
      return;
    }

    const { courseCode, date, slot, roster } = this.currentMarking;

    // Check for Duplicate Attendance Entry
    const existingIndex = this.attendanceRecords.findIndex(
      r => r.courseCode === courseCode && r.date === date && r.slot === slot
    );

    if (existingIndex !== -1) {
      // DUPLICATE DETECTED - Show Duplicate Prevention Warning Modal
      this.showDuplicateModal(existingIndex);
      return;
    }

    // Save as new record
    const selectedCourse = this.courses.find(c => c.code === courseCode);
    const newRecord = {
      id: `REC-${Date.now()}`,
      courseCode: courseCode,
      courseName: selectedCourse ? selectedCourse.name : courseCode,
      date: date,
      slot: slot,
      faculty: this.currentUser.name,
      records: { ...roster },
      timestamp: new Date().toISOString()
    };

    this.attendanceRecords.unshift(newRecord);
    this.onAttendanceSaved(newRecord);
  }

  showDuplicateModal(recordIndex) {
    const record = this.attendanceRecords[recordIndex];
    const modal = document.getElementById("duplicateModal");
    const desc = document.getElementById("duplicateModalDesc");
    const btnOverwrite = document.getElementById("btnOverwriteAttendance");

    if (desc) {
      desc.innerHTML = `
        Attendance for <strong>${record.courseName} (${record.courseCode})</strong> on 
        <strong>${record.date}</strong> (<em>${record.slot}</em>) has already been saved by <strong>${record.faculty}</strong>.
        <br><br>
        <span style="color:var(--warning); font-size:12.5px;">
          ⚠️ <strong>Duplicate Prevention Rule:</strong> Duplicate entries for the exact same session are blocked to prevent skewed percentages.
        </span>
      `;
    }

    if (btnOverwrite) {
      btnOverwrite.onclick = () => {
        // Authorized update / correction
        record.records = { ...this.currentMarking.roster };
        record.faculty = `${this.currentUser.name} (Updated)`;
        record.timestamp = new Date().toISOString();
        
        modal.classList.remove("active");
        
        // Dispatch correction alert
        this.addNotification({
          type: "correction",
          title: `Attendance Corrected: ${record.courseCode}`,
          message: `Attendance updated for ${record.date} (${record.slot}) by ${this.currentUser.name}.`,
          time: "Just now",
          icon: "🔄"
        });

        this.saveState();
        this.renderReports();
        this.showToast("Attendance record successfully updated!", "success");
      };
    }

    modal.classList.add("active");
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  onAttendanceSaved(record) {
    // 1. Dispatch Attendance Update Notification
    this.addNotification({
      type: "update",
      title: `Attendance Recorded: ${record.courseCode}`,
      message: `${record.faculty} marked attendance for ${record.courseName} on ${record.date} (${record.slot}).`,
      time: "Just now",
      icon: "📋"
    });

    // 2. Check for low attendance (<75%)
    this.checkLowAttendanceThresholds();

    // 3. Save state & refresh UI
    this.saveState();
    this.renderReports();
    this.showToast("Attendance successfully saved and notifications dispatched!", "success");
  }

  checkLowAttendanceThresholds() {
    const stats = this.computeStudentStats();
    stats.forEach(st => {
      if (st.percentage < 75) {
        // Trigger alert if not already notified
        const exists = this.notifications.some(n => n.type === "alert-shortage" && n.message.includes(st.name));
        if (!exists) {
          this.addNotification({
            type: "alert-shortage",
            title: `Low Attendance Alert: ${st.name} (<75%)`,
            message: `Attendance for ${st.name} (Roll ${st.id}) has fallen to ${st.percentage}%, below the required 75% threshold.`,
            time: "Just now",
            icon: "⚠️"
          });
        }
      }
    });
  }

  addNotification(notif) {
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      read: false,
      ...notif
    });
    this.saveState();
    this.renderNotifications();
    this.updateNotificationBadge();
  }

  updateNotificationBadge() {
    const badge = document.getElementById("notifBadgeCount");
    const unreadCount = this.notifications.filter(n => !n.read).length;
    if (badge) {
      if (unreadCount > 0) {
        badge.style.display = "flex";
        badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
      } else {
        badge.style.display = "none";
      }
    }
  }

  computeStudentStats() {
    const courseFilter = document.getElementById("reportCourseFilter") ? document.getElementById("reportCourseFilter").value : "ALL";
    const filteredRecords = courseFilter === "ALL" 
      ? this.attendanceRecords 
      : this.attendanceRecords.filter(r => r.courseCode === courseFilter);

    const stats = this.students.map(student => {
      let total = 0;
      let attended = 0;

      filteredRecords.forEach(rec => {
        if (rec.records[student.id]) {
          total++;
          if (rec.records[student.id] === "Present") {
            attended++;
          }
        }
      });

      const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        color: student.color,
        total: total,
        attended: attended,
        absent: total - attended,
        percentage: percentage
      };
    });

    return stats;
  }

  renderReports() {
    const stats = this.computeStudentStats();
    
    // Summary Metric Cards
    const totalClasses = this.attendanceRecords.length;
    const avgPercentage = stats.length > 0 
      ? Math.round(stats.reduce((acc, s) => acc + s.percentage, 0) / stats.length) 
      : 0;
    const shortageCount = stats.filter(s => s.percentage < 75).length;
    const starCount = stats.filter(s => s.percentage >= 90).length;

    const elTotalClasses = document.getElementById("metricTotalClasses");
    const elAvgPercent = document.getElementById("metricAvgPercentage");
    const elShortageCount = document.getElementById("metricShortageCount");
    const elStarCount = document.getElementById("metricStarCount");

    if (elTotalClasses) elTotalClasses.textContent = totalClasses;
    if (elAvgPercent) elAvgPercent.textContent = `${avgPercentage}%`;
    if (elShortageCount) elShortageCount.textContent = shortageCount;
    if (elStarCount) elStarCount.textContent = starCount;

    // Filter by student or search
    const studentFilter = document.getElementById("reportStudentFilter") ? document.getElementById("reportStudentFilter").value : "ALL";
    const searchQuery = document.getElementById("reportSearchInput") ? document.getElementById("reportSearchInput").value.toLowerCase() : "";

    let displayedStats = stats;
    if (studentFilter !== "ALL") {
      displayedStats = displayedStats.filter(s => s.id === studentFilter);
    }
    if (searchQuery) {
      displayedStats = displayedStats.filter(s => s.name.toLowerCase().includes(searchQuery) || s.id.toLowerCase().includes(searchQuery));
    }

    // Render Student-wise table
    const tableBody = document.getElementById("studentReportsTableBody");
    if (tableBody) {
      let rows = "";
      displayedStats.forEach(st => {
        let badgeClass = "badge-safe";
        let statusText = "Safe (≥75%)";
        let barColor = "var(--success)";

        if (st.percentage < 65) {
          badgeClass = "badge-critical";
          statusText = "Critical Shortage";
          barColor = "var(--danger)";
        } else if (st.percentage < 75) {
          badgeClass = "badge-warning";
          statusText = "Shortage Alert";
          barColor = "var(--warning)";
        }

        rows += `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="user-avatar" style="background:${st.color}; width:28px; height:28px; font-size:11px;">${st.avatar}</div>
                <div>
                  <strong>${st.name}</strong>
                  <div style="font-size:11px; color:var(--text-dim);">${st.id}</div>
                </div>
              </div>
            </td>
            <td><strong>${st.total}</strong> sessions</td>
            <td><span style="color:var(--success); font-weight:600;">${st.attended}</span></td>
            <td><span style="color:var(--danger); font-weight:600;">${st.absent}</span></td>
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:700; font-size:14px; min-width:40px;">${st.percentage}%</span>
                <div class="bar-track" style="width:90px; margin:0;">
                  <div class="bar-fill" style="width:${st.percentage}%; background:${barColor};"></div>
                </div>
              </div>
            </td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
          </tr>
        `;
      });
      tableBody.innerHTML = rows;
    }

    // Render Daily History Table
    const historyBody = document.getElementById("dailyHistoryTableBody");
    if (historyBody) {
      let historyRows = "";
      this.attendanceRecords.slice(0, 10).forEach(rec => {
        const presentCount = Object.values(rec.records).filter(v => v === "Present").length;
        const total = Object.values(rec.records).length;
        const percent = Math.round((presentCount / total) * 100);

        historyRows += `
          <tr>
            <td><span style="font-family:'JetBrains Mono';">${rec.date}</span></td>
            <td><strong>${rec.courseName}</strong> (${rec.courseCode})</td>
            <td><span class="badge badge-info">${rec.slot}</span></td>
            <td>${rec.faculty}</td>
            <td><strong style="color:var(--success);">${presentCount}</strong> / ${total} (${percent}%)</td>
            <td><span class="badge badge-safe">Verified</span></td>
          </tr>
        `;
      });
      historyBody.innerHTML = historyRows;
    }
  }

  renderNotifications() {
    const container = document.getElementById("notificationsListContainer");
    if (!container) return;

    if (this.notifications.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-dim);">No notifications received.</div>`;
      return;
    }

    let html = "";
    this.notifications.forEach(n => {
      const isUnread = !n.read;
      const isAlert = n.type === "alert-shortage";

      html += `
        <div class="notification-card ${isUnread ? 'unread' : ''} ${isAlert ? 'alert-shortage' : ''}">
          <div class="notification-icon" style="background:${isAlert ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'};">
            ${n.icon || '🔔'}
          </div>
          <div class="notification-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div class="notification-title">${n.title}</div>
              ${isUnread ? `<span class="badge badge-info" style="font-size:10px;">New</span>` : ''}
            </div>
            <div class="notification-desc">${n.message}</div>
            <div class="notification-time">${n.time}</div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  exportReportsCSV() {
    const stats = this.computeStudentStats();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student ID,Student Name,Email,Total Sessions,Attended,Absent,Attendance Percentage,Status\n";

    stats.forEach(st => {
      const status = st.percentage >= 75 ? "Safe" : "Shortage (<75%)";
      csvContent += `${st.id},"${st.name}",${st.email},${st.total},${st.attended},${st.absent},${st.percentage}%,${status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast("Attendance report downloaded as CSV", "success");
  }

  showcasePagesData() {
    return {
      1: {
        title: "Page 1: GitHub Collaboration",
        subtitle: "Repository Collaboration and Team Setup",
        content: `
          <p>The repository collaboration area is used to manage access and team participation in the Student Attendance Tracker project. Organization-level branch protections, review mandates, and role hierarchies ensure strict quality control throughout development.</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:20px 0;">
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page1_collaboration_settings.png" style="width:100%; display:block;" alt="Collaboration Settings">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 1.1: Collaboration Settings & Access Policies</div>
            </div>
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page1_team_members.png" style="width:100%; display:block;" alt="Team Members">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 1.2: Repository Collaborators & Scrum Team (9 members)</div>
            </div>
          </div>
        `
      },
      2: {
        title: "Page 2: GitHub Project",
        subtitle: "Project Creation and Initial Board",
        content: `
          <p>A GitHub Project is created for the Student Attendance Tracker. The repository issues are added to the project to organize the development tasks. The project board provides a central place to organize issues and track their progress through different stages: Todo, In Progress, Review, and Done.</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:20px 0;">
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page2_create_project.png" style="width:100%; display:block;" alt="Create Project">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 2.1: Creating GitHub Project Board</div>
            </div>
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page2_initial_board.png" style="width:100%; display:block;" alt="Initial Board">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 2.2: Initial Project Board Setup</div>
            </div>
          </div>
        `
      },
      3: {
        title: "Page 3: Feature Issue and Backlog",
        subtitle: "Student Attendance Management Parent Epic",
        content: `
          <p>The Student Attendance feature is created as a parent issue. It defines the core requirements for recording, storing, and displaying student attendance:</p>
          <ul style="margin: 12px 24px; color: var(--text-muted);">
            <li>Record attendance as Present or Absent</li>
            <li>Store attendance date, subject code, and student details</li>
            <li>Allow authorized faculty to mark attendance</li>
            <li>Display attendance records and percentages in real time</li>
            <li>Prevent duplicate attendance entries for the same student and session</li>
          </ul>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:20px 0;">
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page3_parent_feature_issue.png" style="width:100%; display:block;" alt="Parent Feature Issue">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 3.1: Parent Feature Issue #1</div>
            </div>
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page3_main_features_board.png" style="width:100%; display:block;" alt="Main Features on Board">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 3.2: 4 Main Features in Product Backlog</div>
            </div>
          </div>
        `
      },
      4: {
        title: "Page 4: Product Backlog",
        subtitle: "Sub-issues Decomposition",
        content: `
          <p>Each main feature is divided into smaller Sub-issues so that the team can implement and track the work step by step. The parent issue becomes complete when its related Sub-issues are completed.</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:16px 0;">
            <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border-subtle);">
              <strong style="color:var(--primary);">1. User Login and Authentication</strong>
              <ul style="margin-top:8px; padding-left:18px; font-size:13px; color:var(--text-muted);">
                <li>Create login page</li>
                <li>Add student and faculty login</li>
                <li>Validate username and password</li>
                <li>Implement role-based access</li>
                <li>Test login functionality</li>
              </ul>
            </div>
            <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border-subtle);">
              <strong style="color:var(--success);">2. Attendance Marking</strong>
              <ul style="margin-top:8px; padding-left:18px; font-size:13px; color:var(--text-muted);">
                <li>Select class or subject</li>
                <li>Display student list</li>
                <li>Mark students Present or Absent</li>
                <li>Save attendance records</li>
                <li>Test attendance marking</li>
              </ul>
            </div>
            <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border-subtle);">
              <strong style="color:var(--warning);">3. Attendance Reports</strong>
              <ul style="margin-top:8px; padding-left:18px; font-size:13px; color:var(--text-muted);">
                <li>Retrieve attendance records</li>
                <li>Display daily attendance</li>
                <li>Calculate attendance percentage</li>
                <li>Generate student-wise reports</li>
                <li>Test report generation</li>
              </ul>
            </div>
            <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border-subtle);">
              <strong style="color:var(--purple);">4. Notifications</strong>
              <ul style="margin-top:8px; padding-left:18px; font-size:13px; color:var(--text-muted);">
                <li>Notify students about attendance updates</li>
                <li>Send low-attendance alerts (<75%)</li>
                <li>Notify students when attendance is updated</li>
                <li>Integrate notifications with reports</li>
                <li>Test notification functionality</li>
              </ul>
            </div>
          </div>
        `
      },
      5: {
        title: "Page 5: Notifications Feature",
        subtitle: "Notifications and Alerts Integration",
        content: `
          <p>The Notifications feature is planned as the fourth main product feature. It connects attendance marking and reports so students receive immediate updates when sessions are recorded or when attendance drops below the 75% requirement.</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:20px 0;">
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page5_notifications_parent_issue.png" style="width:100%; display:block;" alt="Notifications Parent Issue">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 5.1: Notifications Parent Issue #5</div>
            </div>
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page5_notification_sub_issues.png" style="width:100%; display:block;" alt="Notification Sub-issues">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 5.2: 5 Notification Sub-issues Breakdown</div>
            </div>
          </div>
        `
      },
      6: {
        title: "Page 6: GitHub Project Board",
        subtitle: "Project Board and Current Iteration",
        content: `
          <p>The current iteration groups tasks according to the team's sprint plan. Tasks transition through four workflow stages: <strong>Todo</strong>, <strong>In Progress</strong>, <strong>Review</strong>, and <strong>Done</strong>.</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:20px 0;">
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page6_current_iteration.png" style="width:100%; display:block;" alt="Current Iteration">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 6.1: Iteration 3 Sprint Progress (83%)</div>
            </div>
            <div style="background:#0d1117; border:1px solid var(--border-subtle); border-radius:8px; overflow:hidden;">
              <img src="screenshots/page6_project_board_status.png" style="width:100%; display:block;" alt="Project Board Status">
              <div style="padding:8px 12px; font-size:12px; color:var(--text-muted); background:var(--bg-input);">Screenshot 6.2: Project Board Workflow Status</div>
            </div>
          </div>
        `
      },
      7: {
        title: "Page 7: About the Project",
        subtitle: "Scrum Team Responsibilities & Methodology",
        content: `
          <p>The Student Attendance Tracker is a Scrum-based software project designed to simplify attendance management in an educational institution.</p>
          <div style="background:var(--bg-input); padding:16px; border-radius:8px; margin:16px 0; border:1px solid var(--border-subtle);">
            <h4 style="color:var(--primary); margin-bottom:8px;">Team Responsibilities</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px;">
              <div><strong>manukanta</strong> — User Login and Authentication</div>
              <div><strong>umender</strong> — Attendance Marking</div>
              <div><strong>jagan</strong> — Attendance Reports</div>
              <div><strong>sai ram</strong> — Notifications</div>
            </div>
          </div>
          <div style="background:var(--bg-input); padding:16px; border-radius:8px; margin:16px 0; border:1px solid var(--border-subtle);">
            <h4 style="color:var(--success); margin-bottom:8px;">Product Goal & Lifecycle</h4>
            <p style="font-weight:600; font-size:13.5px; margin-bottom:6px;">Login → Mark Attendance → View Attendance Reports → Receive Notifications</p>
            <p style="font-size:12.5px; color:var(--text-dim);">Product Backlog → Sprint Planning → Sprint → Daily Scrum → Development → Sprint Review → Sprint Retrospective → Next Sprint</p>
          </div>
        `
      },
      8: {
        title: "Page 8: Sprint 1 — User Login and Authentication",
        subtitle: "Assigned Member: Vamshi",
        content: `
          <div style="background:var(--bg-input); padding:18px; border-radius:8px; border:1px solid var(--border-subtle);">
            <strong style="color:var(--primary); font-size:15px;">Sprint Tasks:</strong>
            <ol style="margin-top:8px; padding-left:20px; font-size:13.5px; color:var(--text-muted);">
              <li>Design the login page.</li>
              <li>Implement student and faculty login.</li>
              <li>Validate login credentials.</li>
              <li>Add role-based access.</li>
              <li>Test login functionality.</li>
            </ol>
            <div style="margin-top:16px; padding-top:12px; border-top:1px solid var(--border-subtle);">
              <strong>Sprint Goal:</strong> Allow authorized students and faculty to log in to the Student Attendance Tracker.<br>
              <strong>Sprint 1 Output:</strong> A working authentication module providing secure access to the attendance system.
            </div>
          </div>
        `
      },
      9: {
        title: "Page 9: Sprint 2 — Attendance Marking",
        subtitle: "Assigned Member: Eswar",
        content: `
          <div style="background:var(--bg-input); padding:18px; border-radius:8px; border:1px solid var(--border-subtle);">
            <strong style="color:var(--success); font-size:15px;">Sprint Tasks:</strong>
            <ol style="margin-top:8px; padding-left:20px; font-size:13.5px; color:var(--text-muted);">
              <li>Select class or subject.</li>
              <li>Display the student list.</li>
              <li>Mark attendance as Present or Absent.</li>
              <li>Save attendance records with the date.</li>
              <li>Prevent duplicate entries.</li>
              <li>Test attendance marking.</li>
            </ol>
            <div style="margin-top:16px; padding-top:12px; border-top:1px solid var(--border-subtle);">
              <strong>Sprint Goal:</strong> Allow faculty to record student attendance accurately and efficiently.<br>
              <strong>Sprint 2 Output:</strong> A working attendance-marking module that stores attendance records for report generation.
            </div>
          </div>
        `
      },
      10: {
        title: "Page 10: Sprint 3 — Reports, Notifications and Integration",
        subtitle: "Assigned Members: Rishikesh, Nithish & Team",
        content: `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border-subtle);">
              <strong style="color:var(--warning);">Attendance Reports — Rishikesh</strong>
              <ul style="margin-top:8px; padding-left:18px; font-size:13px; color:var(--text-muted);">
                <li>Retrieve attendance records.</li>
                <li>Display daily attendance.</li>
                <li>Calculate attendance percentage.</li>
                <li>Generate student-wise reports.</li>
                <li>Test report generation.</li>
              </ul>
            </div>
            <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border-subtle);">
              <strong style="color:var(--purple);">Notifications — Nithish & Team</strong>
              <ul style="margin-top:8px; padding-left:18px; font-size:13px; color:var(--text-muted);">
                <li>Send attendance update notifications.</li>
                <li>Generate low-attendance alerts (<75%).</li>
                <li>Notify students about corrections.</li>
                <li>Test notifications.</li>
                <li>Integrate all modules.</li>
              </ul>
            </div>
          </div>
          <div style="margin-top:16px; background:var(--bg-input); padding:14px; border-radius:8px; font-size:13.5px; border:1px solid var(--border-subtle);">
            <strong>Sprint Goal:</strong> Connect authentication, attendance marking, reports, and notifications to produce a complete Student Attendance Tracker.<br>
            <strong>Sprint 3 Output:</strong> An integrated system that allows users to log in, manage attendance, view reports, and receive notifications.
          </div>
        `
      },
      11: {
        title: "Page 11: GitHub Workflow and Final Progress",
        subtitle: "Scrum Delivery Pipeline & Conclusion",
        content: `
          <div style="background:var(--bg-input); padding:16px; border-radius:8px; margin-bottom:16px; border:1px solid var(--border-subtle);">
            <strong style="color:var(--primary);">GitHub Workflow Progression:</strong>
            <p style="font-weight:600; margin-top:6px; font-size:14px;">Issues → Sub-issues → Todo → In Progress → Review → Done</p>
          </div>
          <div style="background:var(--bg-input); padding:16px; border-radius:8px; margin-bottom:16px; border:1px solid var(--border-subtle);">
            <strong style="color:var(--success);">Scrum Activities:</strong>
            <ul style="margin-top:8px; padding-left:18px; font-size:13px; color:var(--text-muted);">
              <li><strong>Daily Scrum:</strong> Team members discuss completed work, planned work, and blockers.</li>
              <li><strong>Sprint Review:</strong> The team demonstrates the features completed during the sprint.</li>
              <li><strong>Sprint Retrospective:</strong> The team discusses what went well, what went wrong, and what can be improved.</li>
            </ul>
          </div>
          <div style="background:var(--bg-input); padding:16px; border-radius:8px; border:1px solid var(--border-subtle);">
            <strong style="color:var(--purple);">Final Product Architecture:</strong>
            <p style="font-size:13.5px; margin-top:6px;">Sprint 1: Auth → Sprint 2: Marking → Sprint 3: Reports + Alerts + Integration → <strong>Final Student Attendance Tracker</strong></p>
            <p style="font-size:12.5px; color:var(--text-dim); margin-top:8px;">The Student Attendance Tracker uses Scrum practices and GitHub collaboration tools to organize and monitor software development.</p>
          </div>
        `
      }
    };
  }

  renderShowcasePage(pageNumber) {
    const pages = this.showcasePagesData();
    const data = pages[pageNumber];
    if (!data) return;

    document.querySelectorAll(".showcase-step-btn").forEach(btn => {
      const p = parseInt(btn.getAttribute("data-page"));
      if (p === pageNumber) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const display = document.getElementById("showcasePageDisplay");
    if (display) {
      display.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h2 style="font-size:20px; font-weight:700; color:var(--text-main);">${data.title}</h2>
            <div style="font-size:13px; color:var(--text-muted);">${data.subtitle}</div>
          </div>
          <span class="badge badge-info" style="font-size:12px;">Page ${pageNumber} of 11</span>
        </div>
        ${data.content}
        <div style="display:flex; justify-content:space-between; margin-top:24px; padding-top:16px; border-top:1px solid var(--border-subtle);">
          <button class="btn btn-secondary" ${pageNumber === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="window.attendanceApp.renderShowcasePage(${pageNumber - 1})">← Previous Page</button>
          <div style="display:flex; gap:10px;">
            <a href="report.html" target="_blank" class="btn btn-secondary">🖨️ Printable View</a>
            <a href="SESD_Assignment_5_Student_Attendance_Tracker.docx" download class="btn btn-primary">📥 Download Word Document</a>
          </div>
          <button class="btn btn-secondary" ${pageNumber === 11 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} onclick="window.attendanceApp.renderShowcasePage(${pageNumber + 1})">Next Page →</button>
        </div>
      `;
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "warning") icon = "⚠️";
    if (type === "danger") icon = "❌";

    toast.innerHTML = `
      <span style="font-size:18px;">${icon}</span>
      <span style="font-size:13.5px; font-weight:500;">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
  window.attendanceApp = new AttendanceApp();
});
