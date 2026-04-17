const { google } = require('googleapis');

/**
 * Configure Google OAuth2 Client
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Verify configuration
 */
const verifyConnection = async () => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.error('❌ Google API: Missing OAuth2 credentials in environment.');
      return false;
    }
    
    if (!process.env.EMAIL_FROM) {
      console.warn('⚠️ Google API: EMAIL_FROM is not set. Emails may fail.');
    }

    // Since we only requested gmail.send scope, getProfile will throw an error. 
    // We just verify credentials exist and oauth2Client is configured.
    await oauth2Client.getAccessToken();
    
    console.log('✅ Google API Connectivity verified (Port 443)');
    return true;
  } catch (error) {
    console.error('❌ Google API Connectivity failed:', error.message);
    return false;
  }
};

module.exports = {
  gmail,
  verifyConnection
};
