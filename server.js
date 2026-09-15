const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE INITIALIZATION ---
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables and run startup migrations
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      custom_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      current_class TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      class_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      ca1 REAL DEFAULT 0,
      ca2 REAL DEFAULT 0,
      exam REAL DEFAULT 0,
      total REAL DEFAULT 0,
      grade TEXT DEFAULT 'F',
      UNIQUE(student_id, class_name, subject)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS student_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      code TEXT NOT NULL,
      teacher TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      UNIQUE(student_id, code)
    )
  `);

  // Ensure Default System Admin Exists
  db.get(`SELECT * FROM users WHERE custom_id = 'HOPS/AD/001'`, (err, row) => {
    if (!row) {
      db.run(`INSERT INTO users (custom_id, full_name, password, role) VALUES ('HOPS/AD/001', 'System Administrator', 'admin123', 'admin')`);
    }
  });

  // --- AUTOMATIC STARTUP MIGRATION ---
  db.run(`UPDATE students SET current_class = 'JSS 1' WHERE current_class LIKE 'JSS 1%' OR current_class LIKE 'JSS1%'`);
  db.run(`UPDATE students SET current_class = 'JSS 2' WHERE current_class LIKE 'JSS 2%' OR current_class LIKE 'JSS2%'`);
  db.run(`UPDATE students SET current_class = 'JSS 3' WHERE current_class LIKE 'JSS 3%' OR current_class LIKE 'JSS3%'`);
  db.run(`UPDATE students SET current_class = 'SS 1' WHERE current_class LIKE 'SS 1%' OR current_class LIKE 'SS1%' OR current_class LIKE 'SSS 1%' OR current_class LIKE 'SSS1%'`);
  db.run(`UPDATE students SET current_class = 'SS 2' WHERE current_class LIKE 'SS 2%' OR current_class LIKE 'SS2%' OR current_class LIKE 'SSS 2%' OR current_class LIKE 'SSS2%'`);
  db.run(`UPDATE students SET current_class = 'SS 3' WHERE current_class LIKE 'SS 3%' OR current_class LIKE 'SS3%' OR current_class LIKE 'SSS 3%' OR current_class LIKE 'SSS3%'`, (err) => {
    if (!err) {
      console.log('Database Class Normalization Auto-Migration Complete.');
    }
  });
});

// Helper: Random Password Generator
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pass = '';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// Helper: Class Name Normalizer
function normalizeClassName(inputClass) {
  if (!inputClass) return 'JSS 1';
  const cleanStr = inputClass.trim().toUpperCase();

  if (cleanStr.startsWith('JSS 1') || cleanStr.startsWith('JSS1')) return 'JSS 1';
  if (cleanStr.startsWith('JSS 2') || cleanStr.startsWith('JSS2')) return 'JSS 2';
  if (cleanStr.startsWith('JSS 3') || cleanStr.startsWith('JSS3')) return 'JSS 3';
  if (cleanStr.startsWith('SS 1') || cleanStr.startsWith('SS1') || cleanStr.startsWith('SSS 1') || cleanStr.startsWith('SSS1')) return 'SS 1';
  if (cleanStr.startsWith('SS 2') || cleanStr.startsWith('SS2') || cleanStr.startsWith('SSS 2') || cleanStr.startsWith('SSS2')) return 'SS 2';
  if (cleanStr.startsWith('SS 3') || cleanStr.startsWith('SS3') || cleanStr.startsWith('SSS 3') || cleanStr.startsWith('SSS3')) return 'SS 3';

  return 'JSS 1';
}

// Default Subject Preset Loader according to class level
function getDefaultClassSubjects(className) {
  const normClass = normalizeClassName(className);

  if (normClass.startsWith('SS')) {
    return [
      { subject: 'Coding & Web Development', code: 'COD201', teacher: 'Mr. Founder', status: 'Active' },
      { subject: 'Computer Science / Data Processing', code: 'ICT202', teacher: 'ICT Department', status: 'Active' },
      { subject: 'Mathematics', code: 'MTH201', teacher: 'Math Department', status: 'Active' },
      { subject: 'English Language', code: 'ENG201', teacher: 'Languages Dept', status: 'Active' },
      { subject: 'Physics', code: 'PHY201', teacher: 'Science Department', status: 'Active' },
      { subject: 'Chemistry', code: 'CHM201', teacher: 'Science Department', status: 'Active' },
      { subject: 'Biology', code: 'BIO201', teacher: 'Science Department', status: 'Active' },
      { subject: 'Civic Education', code: 'CVE201', teacher: 'Social Sciences', status: 'Active' },
      { subject: 'Economics', code: 'ECO201', teacher: 'Commercial Dept', status: 'Active' },
      { subject: 'Agricultural Science', code: 'AGR201', teacher: 'Vocational Dept', status: 'Active' }
    ];
  } else {
    return [
      { subject: 'Mathematics', code: 'MTH101', teacher: 'Math Department', status: 'Active' },
      { subject: 'English Language', code: 'ENG101', teacher: 'Languages Dept', status: 'Active' },
      { subject: 'Basic Science', code: 'BSC101', teacher: 'Science Department', status: 'Active' },
      { subject: 'Basic Technology', code: 'BTC101', teacher: 'Tech Department', status: 'Active' },
      { subject: 'Coding & Robotics', code: 'COD101', teacher: 'Mr. Founder', status: 'Active' },
      { subject: 'Computer Studies', code: 'ICT101', teacher: 'ICT Department', status: 'Active' },
      { subject: 'Civic Education', code: 'CVE101', teacher: 'Social Sciences', status: 'Active' },
      { subject: 'Social Studies', code: 'SST101', teacher: 'Social Sciences', status: 'Active' },
      { subject: 'Business Studies', code: 'BST101', teacher: 'Commercial Dept', status: 'Active' },
      { subject: 'Agricultural Science', code: 'AGR101', teacher: 'Vocational Dept', status: 'Active' }
    ];
  }
}

// --- AUTHENTICATION API: LOGIN ---
app.post('/api/login', (req, res) => {
  const { idNumber, password, role } = req.body;

  if (!idNumber || !password) {
    return res.status(400).json({ success: false, message: 'ID Number and Password are required.' });
  }

  const cleanId = idNumber.trim().toUpperCase();
  const cleanPass = password.trim();

  const query = `SELECT * FROM users WHERE custom_id = ? AND password = ?`;

  db.get(query, [cleanId, cleanPass], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database query error during login.' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid ID or Password.' });
    }

    if (role && user.role !== role && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: `This account is registered as a ${user.role}, not ${role}.` });
    }

    // Retrieve full student details if logging in as student
    if (user.role === 'student') {
      db.get(`SELECT * FROM students WHERE student_id = ?`, [cleanId], (sErr, studentRow) => {
        return res.json({
          success: true,
          message: 'Login successful.',
          user: {
            id: user.custom_id,
            student_id: user.custom_id,
            name: user.full_name,
            className: studentRow ? studentRow.current_class : 'SS 1',
            role: user.role
          }
        });
      });
    } else {
      res.json({
        success: true,
        message: 'Login successful.',
        user: {
          id: user.custom_id,
          name: user.full_name,
          role: user.role
        }
      });
    }
  });
});

// --- STUDENT API: FETCH AVAILABLE SUBJECTS BY CLASS ---
app.get('/api/available-subjects', (req, res) => {
  const className = req.query.class || 'SS 1';
  const subjects = getDefaultClassSubjects(className);
  res.json({ success: true, className: normalizeClassName(className), subjects: subjects });
});

// --- STUDENT API: SAVE ENROLLED COURSES / SUBJECTS ---
const handleEnrollment = (req, res) => {
  const studentId = req.body.studentId;
  const coursesList = req.body.subjects || req.body.courses;

  if (!studentId || !coursesList || !Array.isArray(coursesList)) {
    return res.status(400).json({ success: false, message: 'Student ID and subjects/courses array required.' });
  }

  // Fetch student class level to properly code subjects if codes are omitted
  db.get(`SELECT current_class FROM students WHERE student_id = ?`, [studentId], (sErr, studentRow) => {
    const studentClass = studentRow ? studentRow.current_class : 'SS 1';
    const presets = getDefaultClassSubjects(studentClass);

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Clear existing enrollments for fresh overwrite
      db.run(`DELETE FROM student_courses WHERE student_id = ?`, [studentId]);

      const stmt = db.prepare(`
        INSERT INTO student_courses (student_id, subject, code, teacher, status)
        VALUES (?, ?, ?, ?, 'Active')
      `);

      coursesList.forEach((c) => {
        const subName = c.subject_name || c.subject || '';
        if (!subName) return;

        // Match against presets to resolve code and teacher
        const match = presets.find(p => p.subject.toLowerCase() === subName.toLowerCase());
        const code = c.subject_code || c.code || (match ? match.code : `SUB${Math.floor(100 + Math.random() * 899)}`);
        const teacher = c.teacher || (match ? match.teacher : 'Subject Teacher');

        stmt.run(studentId, subName, code, teacher);
      });

      stmt.finalize();

      db.run("COMMIT", (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Failed to save course enrollments.' });
        }
        res.json({ success: true, message: 'Subjects enrolled successfully!' });
      });
    });
  });
};

app.post('/api/enrol-subjects', handleEnrollment);
app.post('/api/enroll-courses', handleEnrollment);

// --- STUDENT API: FETCH ENROLLED COURSES / SUBJECTS ---
app.get('/api/student-courses', (req, res) => {
  const studentId = req.query.studentId;

  if (!studentId) {
    return res.status(400).json({ success: false, message: 'Student ID required.' });
  }

  db.get(`SELECT current_class FROM students WHERE student_id = ?`, [studentId], (err, student) => {
    const studentClass = student ? student.current_class : 'SS 1';

    // Check student_courses table to see what subjects student self-enrolled in
    db.all(`SELECT subject, code, teacher, status FROM student_courses WHERE student_id = ? ORDER BY subject ASC`, [studentId], (cErr, enrolledRows) => {
      if (!cErr && enrolledRows && enrolledRows.length > 0) {
        return res.json({ success: true, className: studentClass, courses: enrolledRows });
      }

      // Check grades database as secondary fallback
      db.all(`SELECT DISTINCT subject FROM grades WHERE student_id = ?`, [studentId], (gErr, gradeRows) => {
        if (!gErr && gradeRows && gradeRows.length > 0) {
          const enrolledSubjects = gradeRows.map((r, idx) => ({
            subject: r.subject,
            code: `SUB${101 + idx}`,
            teacher: r.subject.includes('Coding') ? 'Mr. Founder' : 'Subject Teacher',
            status: 'Active'
          }));
          return res.json({ success: true, className: studentClass, courses: enrolledSubjects });
        }

        // Default preset fallback if no enrolled records exist
        const defaultCourses = getDefaultClassSubjects(studentClass);
        res.json({ success: true, className: studentClass, courses: defaultCourses });
      });
    });
  });
});

// --- STUDENT API: FETCH GRADES & COMPLETE REPORT CARD DATA ---
app.get('/api/student-grades', (req, res) => {
  const studentId = req.query.studentId;

  if (!studentId) {
    return res.status(400).json({ success: false, message: 'Student ID required.' });
  }

  const cleanId = studentId.trim().toUpperCase();

  // First fetch student demographic profile
  db.get(`SELECT student_id, full_name, current_class FROM students WHERE student_id = ?`, [cleanId], (sErr, student) => {
    if (sErr) {
      return res.status(500).json({ success: false, message: 'Error retrieving student profile.' });
    }

    // Fallback profile check against users table if not in students table
    const studentName = student ? student.full_name : 'Student';
    const studentClass = student ? student.current_class : 'N/A';

    // Fetch grade ledger
    db.all(`SELECT subject, ca1, ca2, exam, total, grade FROM grades WHERE student_id = ? ORDER BY subject ASC`, [cleanId], (gErr, rows) => {
      if (gErr) {
        return res.status(500).json({ success: false, message: 'Error retrieving grades.' });
      }

      // Compute performance metrics
      let grandTotal = 0;
      rows.forEach(r => grandTotal += (r.total || 0));
      const overallAverage = rows.length > 0 ? (grandTotal / rows.length).toFixed(2) : '0.00';

      res.json({
        success: true,
        student: {
          id: cleanId,
          name: studentName,
          class: studentClass
        },
        grades: rows,
        summary: {
          totalSubjects: rows.length,
          grandTotal: grandTotal,
          average: overallAverage
        }
      });
    });
  });
});

// --- ADMIN API: ALL USERS LIST ---
app.get('/api/admin/all-users', (req, res) => {
  const query = `
    SELECT u.custom_id AS id, u.full_name AS name, u.password, u.role, s.current_class AS class
    FROM users u
    LEFT JOIN students s ON u.custom_id = s.student_id
    ORDER BY u.id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database query error.' });
    }
    res.json({ success: true, users: rows });
  });
});

// --- ADMIN API: BULK GENERATE CREDENTIALS ---
app.post('/api/admin/generate-credentials', (req, res) => {
  const { entries, names, role } = req.body;
  const rawList = entries || names;

  if (!rawList || !Array.isArray(rawList) || rawList.length === 0 || !role) {
    return res.status(400).json({ success: false, message: 'Entries array and role are required.' });
  }

  let prefix = 'HOPS/ST/';
  let table = 'students';
  let idCol = 'student_id';

  if (role === 'staff') {
    prefix = 'HOPS/SF/';
    table = 'staff';
    idCol = 'staff_id';
  } else if (role === 'parent') {
    prefix = 'HOPS/PR/';
    table = 'parents';
    idCol = 'parent_id';
  }

  db.get(`SELECT COUNT(*) as count FROM users WHERE custom_id LIKE ?`, [`${prefix}%`], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database counter error.' });
    }

    let startNum = (row ? row.count : 0) + 1;
    const createdUsers = [];

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const stmtUser = db.prepare(`INSERT INTO users (custom_id, full_name, password, role) VALUES (?, ?, ?, ?)`);
      const stmtRole = role === 'student' 
        ? db.prepare(`INSERT INTO students (student_id, full_name, current_class, password) VALUES (?, ?, ?, ?)`)
        : db.prepare(`INSERT INTO ${table} (${idCol}, full_name, password) VALUES (?, ?, ?)`);

      rawList.forEach((item) => {
        let cleanName = '';
        let studentClass = 'JSS 1';

        if (typeof item === 'object' && item !== null) {
          cleanName = item.name ? item.name.trim() : '';
          studentClass = normalizeClassName(item.className);
        } else if (typeof item === 'string') {
          cleanName = item.trim();
        }

        if (!cleanName) return;

        const paddedIndex = String(startNum).padStart(3, '0');
        const customId = `${prefix}${paddedIndex}`;
        const tempPassword = generatePassword();

        stmtUser.run(customId, cleanName, tempPassword, role);

        if (role === 'student') {
          stmtRole.run(customId, cleanName, studentClass, tempPassword);
        } else {
          stmtRole.run(customId, cleanName, tempPassword);
        }

        createdUsers.push({
          id: customId,
          name: cleanName,
          class: role === 'student' ? studentClass : 'N/A',
          password: tempPassword,
          role: role
        });

        startNum++;
      });

      stmtUser.finalize();
      stmtRole.finalize();

      db.run("COMMIT", (commitErr) => {
        if (commitErr) {
          return res.status(500).json({ success: false, message: 'Transaction error while committing credentials.' });
        }

        res.json({
          success: true,
          message: `Successfully generated credentials for ${createdUsers.length} account(s).`,
          users: createdUsers
        });
      });
    });
  });
});

// --- ADMIN API: DELETE USER ---
app.delete('/api/admin/delete-user/:id', (req, res) => {
  const userId = req.params.id;

  if (userId === 'HOPS/AD/001') {
    return res.status(403).json({ success: false, message: 'System Admin cannot be deleted.' });
  }

  db.serialize(() => {
    db.run(`DELETE FROM users WHERE custom_id = ?`, [userId]);
    db.run(`DELETE FROM students WHERE student_id = ?`, [userId]);
    db.run(`DELETE FROM staff WHERE staff_id = ?`, [userId]);
    db.run(`DELETE FROM parents WHERE parent_id = ?`, [userId]);
    db.run(`DELETE FROM grades WHERE student_id = ?`, [userId]);
    db.run(`DELETE FROM student_courses WHERE student_id = ?`, [userId], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to complete deletion.' });
      }
      res.json({ success: true, message: `User ${userId} successfully removed.` });
    });
  });
});

// --- ADMIN API: CLEAR ALL USERS ---
app.delete('/api/admin/clear-all-users', (req, res) => {
  db.serialize(() => {
    db.run(`DELETE FROM users WHERE role != 'admin'`);
    db.run(`DELETE FROM students`);
    db.run(`DELETE FROM staff`);
    db.run(`DELETE FROM parents`);
    db.run(`DELETE FROM grades`);
    db.run(`DELETE FROM student_courses`, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to clear user records.' });
      }
      res.json({ success: true, message: 'All user credentials and records cleared successfully.' });
    });
  });
});

// --- ONE-TIME CLEANUP API: MANUAL CLASS NORMALIZATION ---
app.get('/api/admin/clean-classes', (req, res) => {
  db.serialize(() => {
    db.run(`UPDATE students SET current_class = 'JSS 1' WHERE current_class LIKE 'JSS 1%' OR current_class LIKE 'JSS1%'`);
    db.run(`UPDATE students SET current_class = 'JSS 2' WHERE current_class LIKE 'JSS 2%' OR current_class LIKE 'JSS2%'`);
    db.run(`UPDATE students SET current_class = 'JSS 3' WHERE current_class LIKE 'JSS 3%' OR current_class LIKE 'JSS3%'`);
    db.run(`UPDATE students SET current_class = 'SS 1' WHERE current_class LIKE 'SS 1%' OR current_class LIKE 'SS1%' OR current_class LIKE 'SSS 1%' OR current_class LIKE 'SSS1%'`);
    db.run(`UPDATE students SET current_class = 'SS 2' WHERE current_class LIKE 'SS 2%' OR current_class LIKE 'SS2%' OR current_class LIKE 'SSS 2%' OR current_class LIKE 'SSS2%'`);
    db.run(`UPDATE students SET current_class = 'SS 3' WHERE current_class LIKE 'SS 3%' OR current_class LIKE 'SS3%' OR current_class LIKE 'SSS 3%' OR current_class LIKE 'SSS3%'`, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to update database records.' });
      }
      res.json({ success: true, message: 'All student classes successfully normalized to standard JSS 1 - SS 3!' });
    });
  });
});

// --- STAFF API: FETCH STUDENTS BY CLASS ---
app.get('/api/students-by-class', (req, res) => {
  const className = req.query.class;

  if (!className) {
    return res.status(400).json({ success: false, message: 'Class query parameter is required.' });
  }

  const normalizedTarget = normalizeClassName(className);
  const rawCompactTarget = className.replace(/\s+/g, '');

  const query = `
    SELECT student_id, full_name, current_class 
    FROM students 
    WHERE current_class = ? 
       OR REPLACE(current_class, ' ', '') = ?
    ORDER BY full_name ASC
  `;

  db.all(query, [normalizedTarget, rawCompactTarget], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve students.' });
    }
    res.json({ success: true, students: rows });
  });
});

// --- STAFF API: SAVE GRADES ---
app.post('/api/save-grades', (req, res) => {
  const { className, subject, grades } = req.body;

  if (!className || !subject || !grades || !Array.isArray(grades)) {
    return res.status(400).json({ success: false, message: 'Missing parameters or invalid grades data.' });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      INSERT INTO grades (student_id, class_name, subject, ca1, ca2, exam, total, grade)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, class_name, subject) DO UPDATE SET
        ca1 = excluded.ca1,
        ca2 = excluded.ca2,
        exam = excluded.exam,
        total = excluded.total,
        grade = excluded.grade
    `);

    grades.forEach(g => {
      stmt.run(g.studentId, className, subject, g.ca1, g.ca2, g.exam, g.total, g.grade);
    });

    stmt.finalize();

    db.run("COMMIT", (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database save failure.' });
      }
      res.json({ success: true, message: 'Grades successfully recorded.' });
    });
  });
});

// --- STAFF API: FETCH SAVED GRADES ---
app.get('/api/grades', (req, res) => {
  const { className, subject } = req.query;

  if (!className || !subject) {
    return res.status(400).json({ success: false, message: 'Class and subject query parameters required.' });
  }

  const query = `SELECT student_id, ca1, ca2, exam, total, grade FROM grades WHERE class_name = ? AND subject = ?`;

  db.all(query, [className, subject], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database query error.' });
    }
    res.json({ success: true, grades: rows });
  });
});

app.listen(PORT, () => {
  console.log(`HOPS Portal Server running on http://localhost:${PORT}`);
});