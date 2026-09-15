const db = require('./database');

function generateCustomId(role, count) {
  const prefix = role === 'Student' ? 'ST' : role === 'Staff' ? 'SF' : 'PR';
  const padded = String(count).padStart(3, '0');
  return `HOPS/${prefix}/${padded}`;
}

function registerUser(fullName, role, password = 'password123') {
  db.get(`SELECT COUNT(*) as count FROM users WHERE role = ?`, [role], (err, row) => {
    if (err) return console.error(err.message);

    const newId = generateCustomId(role, row.count + 1);

    db.run(
      `INSERT INTO users (custom_id, full_name, password, role) VALUES (?, ?, ?, ?)`,
      [newId, fullName, password, role],
      function (err) {
        if (err) console.error(err.message);
        else console.log(`Registered ${role}: ${fullName} | ID: ${newId} | Pass: ${password}`);
      }
    );
  });
}

// Seed initial users
db.serialize(() => {
  registerUser('Mr. Adebayo', 'Staff');
  registerUser('Blessing Edeme', 'Student');
  registerUser('Mr. Edeme', 'Parent');
});