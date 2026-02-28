import nodemailer from 'nodemailer';

// Create a reusable transporter using Gmail SMTP with App Password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD?.replace(/\s/g, ''), // remove spaces from app password
  },
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using the configured Gmail SMTP transporter.
 */
export async function sendMail(options: MailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    await transporter.sendMail({
      from: `"Shubharambh Enquiries" <${process.env.SMTP_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { success: true };
  } catch (error: any) {
    console.error('[Mailer] Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
}
