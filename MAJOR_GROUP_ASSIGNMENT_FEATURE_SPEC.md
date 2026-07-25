# 🎓 THE BATCHMATES - FEATURE SPECIFICATION DOCUMENT
## Major Auto-Group & Teacher Assignment System

**Document Version:** 1.0  
**Project:** The Batchmates (College Social Network)  
**Status:** Feature Proposal & Architectural Blueprint  

---

### 1. 📌 Executive Summary
The **Major Auto-Group & Teacher Assignment System** is an automated academic management feature for *The Batchmates*. 

Whenever a student sets or updates their **Major** (e.g. *Computer Science & Engineering*) and **Graduating Year** (e.g. *2026*) on their profile, the system automatically enrolls them into their corresponding official **Department & Class Group**.

Within these groups, **Verified Faculty / Teachers** hold Admin privileges to post class assignments, homework PDFs, exam deadlines, and official announcements, while students can submit assignments, view deadlines, and participate in moderated class discussions.

---

### 2. 💡 Key Objectives & Features
1. **Automated Group Enrollment:** Zero manual invite links required. Profile update triggers instant group placement.
2. **Standardized Department Selection:** Dropdown selector to prevent spelling mismatches and fragmented groups.
3. **Dual-Tab Architecture:**
   - 📌 **Official Teacher Desk:** Read-only for students; only Verified Teachers can post announcements & assignments.
   - 💬 **Student Discussion Hub:** Open for batchmate Q&A, study queries, and peer collaboration.
4. **Assignment Submission Portal:** Students can view deadlines and upload assignment solution files directly.
5. **Verified Faculty Badging:** Distinctive `👨‍🏫 Verified Faculty` badge on teacher profiles for security.

---

### 3. 🛠️ System Architecture & Database Schema

#### A. User Schema Extension (`server/models/User.js`)
```javascript
{
  major: {
    type: String,
    enum: [
      'Computer Science & Engineering (CSE)',
      'Information Technology (IT)',
      'Electronics & Communication (ECE)',
      'Electrical Engineering (EE)',
      'Mechanical Engineering (ME)',
      'Civil Engineering (CE)',
      'Biotechnology (BT)',
      'Business Administration (BBA/MBA)'
    ],
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  enrolledGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }]
}
```

#### B. Group Schema (`server/models/Group.js`)
```javascript
{
  name: { type: String, required: true }, // e.g. "CSE - Batch 2026"
  major: { type: String, required: true },
  graduatingYear: { type: String, required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Teachers / Admins
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
}
```

#### C. Assignment Schema (`server/models/Assignment.js`)
```javascript
{
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  attachmentUrl: { type: String, default: '' }, // PDF or Image link
  dueDate: { type: Date, required: true },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
  }]
}
```

---

### 4. 🔌 API Endpoints Specification

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/groups/auto-enroll` | Authenticated User | Auto-assigns user to group based on Major & Year. |
| `GET` | `/api/groups/my-groups` | Authenticated User | Fetches all groups the user is enrolled in. |
| `POST` | `/api/assignments` | Verified Teacher Only | Creates a new class assignment with PDF attachment & deadline. |
| `GET` | `/api/assignments/group/:groupId` | Enrolled Members | Fetches all assignments for a specific class group. |
| `POST` | `/api/assignments/submit/:id` | Enrolled Students | Uploads assignment submission file. |

---

### 5. 🎨 UI / UX Component Design

1. **Profile Major Selector (`Profile.jsx`)**:
   - Standardized dropdown for Major selection.
   - Saves profile and triggers `/api/groups/auto-enroll` silently.

2. **Group Class Hub (`/groups/:id`)**:
   - Top Header Banner: Group Name, Department, Member Count, Teacher Badges.
   - Dual Tab Switcher:
     - `📌 Official Teacher Desk (Assignments & Notices)`
     - `💬 Student Discussion`

3. **Assignment Submission Card**:
   - Deadline Countdown Badge (e.g. `⏳ Due in 2 Days`).
   - PDF Download link for assignment problem statement.
   - Upload Button: `📤 Submit Solution PDF`.

---

### 6. 🛡️ Security & Anti-Spam Guidelines
1. **Teacher Verification Protocol:** Only users with `role: 'teacher'` verified by Admins can publish assignments.
2. **Read-Only Teacher Desk:** Prevents student chit-chat from burying critical assignment notices.
3. **File Type Validation:** Only `.pdf`, `.docx`, and `.jpg` files up to 15MB permitted for assignment submissions.

---

### 7. 🚀 Implementation Roadmap (When Ready)
- [ ] **Step 1:** Update `User.js` schema with standardized Major enum & `role`.
- [ ] **Step 2:** Create `Group.js` & `Assignment.js` models.
- [ ] **Step 3:** Implement auto-enrollment backend logic in `routes/groups.js`.
- [ ] **Step 4:** Build `GroupHub.jsx` frontend page with Teacher Assignment Desk.
- [ ] **Step 5:** Test end-to-end assignment creation, student submission, and PDF downloads.

---
*Document prepared for future implementation upon user request.*
