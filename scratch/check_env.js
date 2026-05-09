const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
  console.log('Error loading .env file:', result.error.message);
} else {
  console.log('.env file loaded successfully.');
  console.log('MAIL_USER:', process.env.MAIL_USER);
  console.log('MAIL_PASS:', process.env.MAIL_PASS ? 'FOUND (hidden)' : 'NOT FOUND');
}
