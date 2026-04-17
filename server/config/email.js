const { SESClient, GetSendQuotaCommand } = require("@aws-sdk/client-ses");

/**
 * Configure AWS SES Client
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
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('❌ AWS SES: Missing credentials in environment.');
      return false;
    }
    
    if (!process.env.EMAIL_FROM) {
      console.warn('⚠️ AWS SES: EMAIL_FROM is not set. Emails may fail.');
    }

    // Try to get quota as a lightweight connectivity test
    const command = new GetSendQuotaCommand({});
    await sesClient.send(command);
    
    console.log('✅ AWS SES Connectivity verified (Port 443)');
    return true;
  } catch (error) {
    console.error('❌ AWS SES Connectivity failed:', error.message);
    return false;
  }
};

module.exports = {
  sesClient,
  verifyConnection
};
