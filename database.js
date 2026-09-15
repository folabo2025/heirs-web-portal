const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./school_portal.db');

db.serialize(() => {
  // 1. Unified Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_id TEXT UNIQUE,
    full_name TEXT,
    password TEXT,
    role TEXT
  )`);

  // 2. Students Table
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE,
    full_name TEXT,
    password TEXT,
    class TEXT DEFAULT 'Not Set',
    current_class TEXT DEFAULT 'Not Set',
    department TEXT DEFAULT 'General',
    gpa REAL DEFAULT 0.0,
    attendance TEXT DEFAULT '100%'
  )`);

  // 3. Staff Table
  db.run(`CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id TEXT UNIQUE,
    full_name TEXT,
    password TEXT,
    department TEXT DEFAULT 'Not Set'
  )`);

  // 4. Parents Table
  db.run(`CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id TEXT UNIQUE,
    full_name TEXT,
    password TEXT
  )`);

  // 5. Admins Table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id TEXT UNIQUE,
    full_name TEXT,
    password TEXT
  )`);

  // 6. Grades Table (for saving student scores)
  db.run(`CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    subject TEXT,
    class_name TEXT,
    ca1 REAL DEFAULT 0,
    ca2 REAL DEFAULT 0,
    exam REAL DEFAULT 0,
    total REAL DEFAULT 0,
    grade TEXT,
    UNIQUE(student_id, subject, class_name)
  )`);

  // 7. Dynamic Student Subjects Enrollment Table
  db.run(`CREATE TABLE IF NOT EXISTS student_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    teacher TEXT DEFAULT 'Subject Teacher',
    status TEXT DEFAULT 'Active',
    UNIQUE(student_id, subject_name)
  )`);

  // --- SEED DEFAULT ADMIN ACCOUNT ---
  db.run(
    `INSERT OR IGNORE INTO admins (admin_id, full_name, password) 
     VALUES ('HOPS/AD/001', 'System Administrator', 'admin123')`
  );

  db.run(
    `INSERT OR IGNORE INTO users (custom_id, full_name, password, role) 
     VALUES ('HOPS/AD/001', 'System Administrator', 'admin123', 'admin')`
  );

  // --- SEED SAMPLE STUDENT RECORD & ENROLLED SUBJECTS ---
  db.run(
    `INSERT OR IGNORE INTO users (custom_id, full_name, password, role)
     VALUES ('HOPS/ST/041', 'Tosanwunmi Ifeoluwa', 'student123', 'student')`
  );

  db.run(
    `INSERT OR IGNORE INTO students (student_id, full_name, password, class, current_class, department)
     VALUES ('HOPS/ST/041', 'Tosanwunmi Ifeoluwa', 'student123', 'SS 1', 'SS 1', 'Science')`
  );

  const defaultSubjects = [
    ['HOPS/ST/041', 'COD201', 'Coding & Web Development', 'Mr. Founder', 'Active'],
    ['HOPS/ST/041', 'ICT202', 'Computer Science / Data Processing', 'ICT Department', 'Active'],
    ['HOPS/ST/041', 'MTH201', 'Mathematics', 'Math Department', 'Active'],
    ['HOPS/ST/041', 'ENG201', 'English Language', 'Languages Dept', 'Active'],
    ['HOPS/ST/041', 'PHY201', 'Physics', 'Science Department', 'Active'],
    ['HOPS/ST/041', 'CHM201', 'Chemistry', 'Science Department', 'Active'],
    ['HOPS/ST/041', 'BIO201', 'Biology', 'Science Department', 'Active'],
    ['HOPS/ST/041', 'CVE201', 'Civic Education', 'Social Sciences', 'Active'],
    ['HOPS/ST/041', 'ECO201', 'Economics', 'Commercial Dept', 'Active'],
    ['HOPS/ST/041', 'AGR201', 'Agricultural Science', 'Vocational Dept', 'Active']
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO student_subjects (student_id, subject_code, subject_name, teacher, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  defaultSubjects.forEach((sub) => {
    stmt.run(sub[0], sub[1], sub[2], sub[3], sub[4]);
  });

  stmt.finalize();
});

module.exports = db;