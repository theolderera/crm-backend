const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'ahmadhayotov2511@gmail.com',
    pass: 'gtiglfavzogtwkav',
  },
});

async function testMail() {
  console.log('Attempting to send test email with NEW password...');
  try {
    const info = await transporter.sendMail({
      from: '"Test" <ahmadhayotov2511@gmail.com>',
      to: 'ahmadhayotov2511@gmail.com',
      subject: 'Test Verification Code (New Password)',
      text: 'Your code is 654321',
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

testMail();
