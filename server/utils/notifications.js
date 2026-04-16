const { gmail } = require('../config/email');
const { query } = require('../config/database');

/**
 * Sends a rejection notification using Gmail REST API
 */
async function sendTESRejectionEmail(participantName, participantId, ldcId, reason) {
  try {
    // 1. Fetch all active staff for this LDC
    const staffResult = await query(
      'SELECT email, full_name FROM users WHERE ldc_id = $1 AND is_active = true AND role = $2',
      [ldcId, 'ldc_staff']
    );

    const staffMembers = staffResult.rows.filter(s => s.email);
    if (staffMembers.length === 0) return;

    const recipientEmails = staffMembers.map(s => s.email).join(', ');

    // 2. Prepare Email Content
    const subject = `Action Required: TES Application Rejected - ${participantName}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
        <h2 style="color: #9b2335;">TES Application Rejected</h2>
        <p>Hello LDC Team,</p>
        <p>The Tertiary Education Support (TES) application for the following participant has been <strong>rejected</strong> by the National Office:</p>
        
        <div style="background: #faf8f3; border: 1px solid #d4c9b0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Participant:</strong> ${participantName}</p>
          <p style="margin: 5px 0 0 0;"><strong>Salesforce ID:</strong> ${participantId}</p>
        </div>

        <h4 style="margin-bottom: 5px;">Reason for Rejection:</h4>
        <div style="background: #f5e0e3; border-left: 4px solid #9b2335; padding: 10px 15px; margin-bottom: 20px;">
          ${reason || 'No specific reason provided.'}
        </div>

        <p>Please log in to the portal to review the comments and resubmit the application if applicable.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b5e4a;">
          This is an automated notification from the CIL Youth Development Platform.
        </p>
      </div>
    `;

    // 3. Create RFC822 Message (required for Gmail API)
    const message = [
      `Content-Type: text/html; charset="UTF-8"\r\n`,
      `MIME-Version: 1.0\r\n`,
      `To: ${recipientEmails}\r\n`,
      `From: "CIL Youth Platform" <${process.env.EMAIL_USER}>\r\n`,
      `Subject: ${subject}\r\n\r\n`,
      htmlBody
    ].join('');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Send via REST API (Port 443)
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`📧 Rejection email sent via API for ${participantId} to: ${recipientEmails}`);
    
  } catch (error) {
    console.error('❌ Failed to send rejection email via API:', error.message);
  }
}

module.exports = {
  sendTESRejectionEmail
};
