import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SENDGRID_API_KEY || process.env.SMTP_PASS || ''
  }
});

export const sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${token}`;
  const message = {
    to,
    from: process.env.FROM_EMAIL || 'noreply@rotatestay.com',
    subject: 'Verify your RotateStay account',
    html: `
      <h1>Welcome to RotateStay</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(message);
    } else {
      await transport.sendMail(message);
    }
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};
