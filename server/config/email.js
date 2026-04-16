const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer with OAuth2 for Google/Gmail
 * Requirements in .env:
 * EMAIL_USER: The gmail address sending the mail
 * GOOGLE_CLIENT_ID
 * GOOGLE_CLIENT_SECRET
 * GOOGLE_REFRESH_TOKEN
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  }
});

/**
 * Verify connection configuration and send a test log
 */
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready and authenticated');
    return true;
  } catch (error) {
    console.error('❌ Email service authentication failed:', error);
    return false;
  }
};

module.exports = {
  transporter,
  verifyConnection
};
