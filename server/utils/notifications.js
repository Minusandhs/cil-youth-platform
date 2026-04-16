const { transporter } = require('../config/email');
const { query } = require('../config/database');

/**
 * Sends a rejection notification to all active staff of a specific LDC
 * @param {string} participantName - Name of the participant
 * @param {string} participantId - Salesforce ID of the participant
 * @param {string} ldcId - UUID of the LDC
 * @param {string} reason - Admin notes / rejection reason
 */
async function sendTESRejectionEmail(participantName, participantId, ldcId, reason) {
  try {
    // 1. Fetch all active staff for this LDC
    const staffResult = await query(
      'SELECT email, full_name FROM users WHERE ldc_id = $1 AND is_active = true AND role = $2',
      [ldcId, 'ldc_staff']
    );

    const staffMembers = staffResult.rows.filter(s => s.email);

    if (staffMembers.length === 0) {
      console.log(`⚠️ No active staff with email found for LDC: ${ldcId}`);
      return;
    }

    const recipientEmails = staffMembers.map(s => s.email).join(', ');

    // 2. Prepare Email Content
    const mailOptions = {
      from: `"CIL Youth Platform" <${process.env.EMAIL_USER}>`,
      to: recipientEmails,
      subject: `Action Required: TES Application Rejected - ${participantName}`,
      html: `
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
      `,
    };

    // 3. Send Email
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Rejection email sent for ${participantId} to: ${recipientEmails}. MessageId: ${info.messageId}`);
    
  } catch (error) {
    console.error('❌ Failed to send rejection email:', error.message);
    // We don't throw here to prevent the API request from failing if email fails
  }
}

module.exports = {
  sendTESRejectionEmail
};
