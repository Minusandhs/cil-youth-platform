const { google } = require('googleapis');

/**
 * Configure Google OAuth2 Client
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Verify connection configuration
 * Note: REST API doesn't have a persistent connection like SMTP, 
 * so we verify by checking if we can get the profile.
 */
const verifyConnection = async () => {
  try {
    await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Gmail API service is ready (Port 443)');
    return true;
  } catch (error) {
    console.error('❌ Gmail API authentication failed:', error.message);
    return false;
  }
};

module.exports = {
  gmail,
  verifyConnection
};
