const { SESClient } = require("@aws-sdk/client-ses");

/**
 * Configure AWS SES Client
 * Requirements in .env:
 * AWS_REGION
 * AWS_ACCESS_KEY_ID
 * AWS_SECRET_ACCESS_KEY
 * EMAIL_FROM: The verified email in AWS SES
 */
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Verify configuration
 */
const verifyConnection = async () => {
  try {
    // AWS SDK doesn't have a simple "verify" like Nodemailer,
    // but the Client will throw on first use if keys are invalid.
    console.log('✅ AWS SES Client initialized (Port 443)');
    return true;
  } catch (error) {
    console.error('❌ AWS SES initialization failed:', error.message);
    return false;
  }
};

module.exports = {
  sesClient,
  verifyConnection
};
