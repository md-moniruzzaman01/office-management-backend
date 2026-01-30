export function LeaveStatusUpdateTemplate({
  name,
  status,
  leaveType,
  from,
  to,
}: {
  name: string;
  status: string;
  leaveType: string;
  from: string;
  to: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Leave Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Google Sans', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Logo -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <img src="https://i.ibb.co/stTVvwF/NT-LOGO.png" alt="Company Logo" style="width: 75px; height: 75px;">
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h1 style="color: #202124; font-size: 24px; font-weight: 500; margin-bottom: 20px;">Hi ${name},</h1>
              
              <p style="color: #5f6368; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
                Your leave request for <strong>${leaveType}</strong> from <strong>${from}</strong> to <strong>${to}</strong> has been <span style="color: ${status === 'Approved' ? '#0F9D58' : '#D93025'}; font-weight: bold;">${status}</span>.
              </p>

              <div style="background-color: #f1f3f4; border-left: 4px solid ${status === 'Approved' ? '#0F9D58' : '#D93025'}; border-radius: 4px; padding: 16px 24px; margin-bottom: 24px;">
                <p style="color: #202124; font-size: 16px; margin: 0;">
                  Please take note of the updated status. If you have any questions, feel free to reach out to HR or your supervisor.
                </p>
              </div>

              <p style="color: #5f6368; font-size: 14px; line-height: 22px; margin-bottom: 24px;">
                Thank you for using our portal system.
              </p>

              <p style="color: #5f6368; font-size: 14px; line-height: 22px;">
                Best regards,<br />
                NEC Group
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #dadce0;">
              <p style="color: #5f6368; font-size: 12px; line-height: 18px; margin: 0;">
                This email was sent to notify you of your leave status update. If you believe this is a mistake, please contact support.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
