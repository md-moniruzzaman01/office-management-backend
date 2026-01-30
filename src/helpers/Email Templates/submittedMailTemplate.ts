/* eslint-disable @typescript-eslint/no-explicit-any */
export const submittedMailTemplate = (props: any) => {
  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; color: white; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">📩 New Contact Form Submission</h2>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 12px;">
            You have received a new message from your website contact form:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #111827; width: 120px;">👤 Name:</td>
              <td style="padding: 8px; color: #374151;">${props.name}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="padding: 8px; font-weight: bold; color: #111827;">📧 Email:</td>
              <td style="padding: 8px; color: #374151;">${props.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #111827; vertical-align: top;">💬 Message:</td>
              <td style="padding: 8px; color: #374151; white-space: pre-line;">${props.message}</td>
            </tr>
          </table>
        </div>
        <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 14px; color: #6b7280;">
          This message was sent via <strong>NEC Group HR Portal's Contact Form</strong>.
        </div>
      </div>
      `;
};
