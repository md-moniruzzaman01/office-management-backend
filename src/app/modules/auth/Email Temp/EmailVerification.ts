export function EmailVerificationTemplate(code: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
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
                            <h1 style="color: #202124; font-size: 24px; font-weight: 400; margin-bottom: 24px;">Verify your email address</h1>
                            <p style="color: #5f6368; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
                                To finish setting up your account, please verify your email address by entering this verification code:
                            </p>
                            
                            <div style="background-color: #f1f3f4; border-radius: 4px; padding: 24px; text-align: center; margin-bottom: 32px;">
                                <span style="color: #202124; font-size: 36px; font-weight: 500; letter-spacing: 4px;">${code}</span>
                            </div>
                            
                            <p style="color: #5f6368; font-size: 14px; line-height: 20px; margin-bottom: 32px;">
                                This code will expire in 5 minutes. If you didn't request this code, you can ignore this email.
                            </p>
                            
                            <p style="color: #5f6368; font-size: 14px; line-height: 20px;">
                                Thanks,<br>
                                The NEC Group Team
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #dadce0;">
                            <p style="color: #5f6368; font-size: 12px; line-height: 18px; margin: 0;">
                                This email was sent to you because you requested a verification code. If you didn't request this code, please ignore this email.
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
