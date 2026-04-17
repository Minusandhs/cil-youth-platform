const { sesClient } = require('../config/email');
const { SendEmailCommand } = require("@aws-sdk/client-ses");
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
    const linkUrl = numericId ? `${portalUrl}/participant/${numericId}?tab=tes` : `${portalUrl}/ldc`;

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

    // 3. Create SES Command
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: recipientEmails,
      },
      Message: {
        Body: {
          Html: { Data: htmlBody },
        },
        Subject: { Data: subject },
      },
      Source: process.env.EMAIL_FROM,
    });

    // 4. Send via SES SDK
    await sesClient.send(command);
    console.log(`📧 Rejection email sent via AWS SES for ${participantId} to: ${recipientEmails.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to send rejection email via AWS SES:', error.message);
  }
}

module.exports = {
  sendTESRejectionEmail
};
