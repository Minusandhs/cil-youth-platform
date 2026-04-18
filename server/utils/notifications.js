const { gmail } = require('../config/email');
const { query } = require('../config/database');

/**
 * Sends a rejection notification using Amazon SES API
 */
async function sendTESRejectionEmail(participantName, participantId, ldcId, reason, batchName = 'Unknown', numericId) {
  try {
    // 1. Fetch all active staff for this LDC
    const staffResult = await query(
      'SELECT email, full_name FROM users WHERE ldc_id = $1 AND is_active = true AND role = $2',
      [ldcId, 'ldc_staff']
    );

    const staffMembers = staffResult.rows.filter(s => s.email);
    if (staffMembers.length === 0) {
      console.warn(`⚠️ No staff emails found for LDC ID: ${ldcId}. Notification skipped.`);
      return;
    }

    const recipientEmails = staffMembers.map(s => s.email);
    const portalUrl = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : 'https://cilyouth.org';
    const linkUrl = numericId ? `${portalUrl}/participant/${numericId}` : `${portalUrl}/ldc`;

    // 2. Prepare Email Content
    const subject = `Action Required: TES Application Rejected - ${participantName}`;
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; line-height: 1.6; color: #3d3528; background-color: #fdfcf9; border: 1px solid #e8e2d6; border-radius: 12px; overflow: hidden; margin: 0 auto;">
        <!-- Header -->
        <div style="background-color: #9b2335; padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">TES Application Rejected</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello LDC Team,</p>
          <p style="font-size: 15px;">The Tertiary Education Support (TES) application for the following participant has been reviewed and <strong>rejected</strong> by the National Office:</p>
          
          <div style="background: #faf8f3; border: 1px solid #d4c9b0; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #6b5e4a; width: 120px; font-weight: 600;">Participant:</td>
                <td style="padding: 5px 0; font-weight: 700;">${participantName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b5e4a; font-weight: 600;">Salesforce ID:</td>
                <td style="padding: 5px 0; font-family: monospace;">${participantId}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b5e4a; font-weight: 600;">Batch Name:</td>
                <td style="padding: 5px 0;">${batchName}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #9b2335; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #f5e0e3; padding-bottom: 5px;">Reason for Rejection / Admin Notes:</h3>
          <div style="background: #fdf1f2; border-left: 5px solid #9b2335; padding: 15px 20px; border-radius: 4px; font-style: italic; color: #7a1b2a; margin-bottom: 30px;">
            ${reason || 'No specific reason provided.'}
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${linkUrl}" style="background-color: #3d3528; color: #f0ece2; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; display: inline-block;">
              View Application in Portal
            </a>
          </div>

          <p style="font-size: 14px; color: #6b5e4a;">Please review the notes above. If the rejection was due to missing or incorrect information, you may update the application and <strong>resubmit</strong> it for another review.</p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f0ece2; padding: 20px; text-align: center; border-top: 1px solid #e8e2d6;">
          <p style="font-size: 12px; color: #6b5e4a; margin: 0;">
            This is an automated notification from the <strong>CIL Youth Development Platform</strong>.
          </p>
        </div>
      </div>
    `;

    // 3. Create raw email message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${process.env.EMAIL_FROM || 'notifications@cilyouth.org'}`,
      `To: ${recipientEmails.join(', ')}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      htmlBody
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Send via Gmail API
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`📧 Rejection email sent via Google API for ${participantId} to: ${recipientEmails.join(', ')}`);

  } catch (error) {
    console.error('❌ Failed to send rejection email via Google API:', error.message);
  }
}

async function sendPasswordResetEmail(recipientEmail, userName, resetLink) {
  try {
    const subject = `Reset Your Password - CIL Youth Development Platform`;
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; line-height: 1.6; color: #3d3528; background-color: #fdfcf9; border: 1px solid #e8e2d6; border-radius: 12px; overflow: hidden; margin: 0 auto;">
        <!-- Header -->
        <div style="background-color: #3d3528; padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hello ${userName},</p>
          <p style="font-size: 15px;">We received a request to reset the password for your account on the CIL Youth Development Platform. If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetLink}" style="background-color: #9b2335; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #6b5e4a; margin-bottom: 5px;">This link will expire in <strong>1 hour</strong>.</p>
          <p style="font-size: 14px; color: #6b5e4a;">If the button above doesn't work, copy and paste this URL into your browser:</p>
          <p style="font-size: 12px; color: #9b2335; word-break: break-all;">${resetLink}</p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f0ece2; padding: 20px; text-align: center; border-top: 1px solid #e8e2d6;">
          <p style="font-size: 12px; color: #6b5e4a; margin: 0;">
            This is an automated notification from the <strong>CIL Youth Development Platform</strong>.
          </p>
        </div>
      </div>
    `;

    // Create raw email message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${process.env.EMAIL_FROM || 'notifications@cilyouth.org'}`,
      `To: ${recipientEmail}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      htmlBody
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`📧 Password reset email sent to: ${recipientEmail}`);

  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
  }
}

module.exports = {
  sendTESRejectionEmail,
  sendPasswordResetEmail
};
