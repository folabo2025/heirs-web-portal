const db = require('./database.js');

function addColumnsAndAssignClasses() {
  db.serialize(() => {
    // 1. Ensure columns exist in the students table
    db.run(`ALTER TABLE students ADD COLUMN current_class TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding current_class:', err.message);
      }
    });

    db.run(`ALTER TABLE students ADD COLUMN department TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding department:', err.message);
      }
    });

    // 2. Assign SS1 General (HOPS/ST/001 to 020)
    db.run(
      `UPDATE students 
       SET current_class = 'SS1 General', department = 'General' 
       WHERE student_id BETWEEN 'HOPS/ST/001' AND 'HOPS/ST/020'`,
      (err) => {
        if (err) console.error('Error updating SS1 General:', err.message);
        else console.log('✅ SS1 General assigned (001 - 020)');
      }
    );

    // 3. Assign SS2 Science (HOPS/ST/021 to 028)
    db.run(
      `UPDATE students 
       SET current_class = 'SS2 Science', department = 'Science' 
       WHERE student_id BETWEEN 'HOPS/ST/021' AND 'HOPS/ST/028'`,
      (err) => {
        if (err) console.error('Error updating SS2 Science:', err.message);
        else console.log('✅ SS2 Science assigned (021 - 028)');
      }
    );

    // 4. Assign SS2 Commercial (HOPS/ST/029 to 034)
    db.run(
      `UPDATE students 
       SET current_class = 'SS2 Commercial', department = 'Commercial' 
       WHERE student_id BETWEEN 'HOPS/ST/029' AND 'HOPS/ST/034'`,
      (err) => {
        if (err) console.error('Error updating SS2 Commercial:', err.message);
        else console.log('✅ SS2 Commercial assigned (029 - 034)');
      }
    );

    // 5. Assign SS2 Arts (HOPS/ST/035 to 041)
    db.run(
      `UPDATE students 
       SET current_class = 'SS2 Arts', department = 'Arts' 
       WHERE student_id BETWEEN 'HOPS/ST/035' AND 'HOPS/ST/041'`,
      (err) => {
        if (err) console.error('Error updating SS2 Arts:', err.message);
        else console.log('✅ SS2 Arts assigned (035 - 041)');
      }
    );
  });
}

addColumnsAndAssignClasses();