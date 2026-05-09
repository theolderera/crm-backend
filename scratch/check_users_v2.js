const Database = require('better-sqlite3');
const db = new Database('crm.sqlite');

try {
  const users = db.prepare("SELECT email, verificationCode, isEmailVerified, createdAt FROM users ORDER BY createdAt DESC LIMIT 5").all();
  console.log('Recent users:');
  users.forEach(u => {
    console.log(`- ${u.email}: code=${u.verificationCode}, verified=${u.isEmailVerified}, created=${u.createdAt}`);
  });
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
