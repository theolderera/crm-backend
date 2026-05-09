const nodemailer = require('nodemailer');

// Manually test the credentials from your .env.example
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'ahmadhayotov2511@gmail.com',
    pass: 'ccslyrdelyidmcbm',
  },
});

async function testMail() {
  console.log('Attempting to send test email...');
  try {
    const info = await transporter.sendMail({
      from: '"Test" <ahmadhayotov2511@gmail.com>',
      to: 'ahmadhayotov2511@gmail.com',
      subject: 'Test Verification Code',
      text: 'Your code is 123456',
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

testMail();
