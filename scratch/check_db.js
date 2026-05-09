const Database = require('better-sqlite3');
const db = new Database('crm.sqlite');

try {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  console.log('Columns in users table:');
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });

  const hasVerified = columns.some(c => c.name === 'isEmailVerified');
  const hasCode = columns.some(c => c.name === 'verificationCode');

  if (hasVerified && hasCode) {
    console.log('\nSUCCESS: Database columns are present.');
  } else {
    console.log('\nFAILURE: Missing columns.');
    if (!hasVerified) console.log('Missing: isEmailVerified');
    if (!hasCode) console.log('Missing: verificationCode');
  }
} catch (err) {
  console.error('Error checking database:', err);
} finally {
  db.close();
}
