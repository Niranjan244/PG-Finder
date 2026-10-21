import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

export const getMailTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return transporter;
};

export const sendPasswordResetEmail = async ({ toEmail, userName, resetUrl }) => {
  const mailTransporter = getMailTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - PG Finder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0284c7; padding: 28px 32px; color: #ffffff; }
        .brand-name { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
        .brand-sub { font-size: 12px; color: #bae6fd; margin-top: 4px; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .paragraph { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .button-area { text-align: center; margin: 32px 0; }
        .reset-btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2); }
        .note { font-size: 12px; color: #64748b; line-height: 1.5; border-left: 3px solid #0284c7; padding-left: 12px; margin: 24px 0; }
        .link-fallback { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
        .link-fallback a { color: #0284c7; }
        .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand-name">PG Finder</div>
          <div class="brand-sub">Secure Accommodation Platform</div>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName || 'Valued User'},</div>
          <p class="paragraph">
            We received a request to reset the password for your PG Finder account associated with <strong>${toEmail}</strong>.
          </p>
          <div class="button-area">
            <a href="${resetUrl}" class="reset-btn" target="_blank">Reset My Password</a>
          </div>
          <div class="note">
            This password reset link is valid for <strong>60 minutes</strong>. If you did not request this password reset, please ignore this email or review your account security.
          </div>
          <div class="link-fallback">
            If the button above does not work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PG Finder Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"PG Finder" <${env.smtpUser}>`,
    to: toEmail,
    subject: 'Reset your PG Finder password',
    text: `Hello ${userName || ''},\n\nYou requested to reset your password. Use the link below to choose a new password:\n${resetUrl}\n\nThis link expires in 60 minutes. If you did not request this, please ignore this email.`,
    html: htmlContent,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`Password reset email successfully sent to ${toEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Email delivery error to ${toEmail}: ${error.message}`);
    console.log(`[LOCAL DEV FALLBACK] Reset URL: ${resetUrl}`);
    throw new Error(`Failed to send password reset email. Please ensure SMTP credentials are valid.`);
  }
};

export const sendBookingConfirmationEmail = async ({
  toEmail,
  tenantName,
  pgTitle,
  roomType,
  rent,
  moveInDate,
}) => {
  const mailTransporter = getMailTransporter();

  const formattedDate = moveInDate ? new Date(moveInDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : 'Scheduled Date';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #059669; padding: 24px 32px; color: #ffffff; }
        .brand-name { font-size: 20px; font-weight: 800; margin: 0; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .details-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .label { color: #64748b; font-weight: 500; }
        .value { color: #0f172a; font-weight: 700; }
        .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand-name">PG Finder</div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">Booking Approved</div>
        </div>
        <div class="content">
          <div class="greeting">Congratulations, ${tenantName || 'Resident'}!</div>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Your accommodation booking request has been <strong>approved</strong> by the property manager.
          </p>
          <div class="details-box">
            <div style="margin-bottom: 8px;"><strong>Accommodation:</strong> ${pgTitle}</div>
            <div style="margin-bottom: 8px;"><strong>Room Category:</strong> ${roomType || 'Standard Room'}</div>
            <div style="margin-bottom: 8px;"><strong>Monthly Rent:</strong> ₹${rent ? rent.toLocaleString('en-IN') : 'N/A'}</div>
            <div><strong>Planned Move-in:</strong> ${formattedDate}</div>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            You can view your active booking in your Tenant Dashboard and message the property manager through the in-app chat.
          </p>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} PG Finder. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await mailTransporter.sendMail({
      from: `"PG Finder Bookings" <${env.smtpUser}>`,
      to: toEmail,
      subject: `Booking Confirmed: ${pgTitle}`,
      text: `Hello ${tenantName},\n\nYour booking request for "${pgTitle}" has been APPROVED!\n\nRoom: ${roomType || 'Standard'}\nMove-in Date: ${formattedDate}\n\nLog in to your PG Finder dashboard to review details.`,
      html: htmlContent,
    });
    console.log(`Booking approval email delivered to ${toEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`Booking approval email delivery error to ${toEmail}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const sendBookingRejectionEmail = async ({
  toEmail,
  tenantName,
  pgTitle,
  reason,
}) => {
  const mailTransporter = getMailTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #e11d48; padding: 24px 32px; color: #ffffff; }
        .brand-name { font-size: 20px; font-weight: 800; margin: 0; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .reason-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #9f1239; }
        .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand-name">PG Finder</div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">Booking Update</div>
        </div>
        <div class="content">
          <div class="greeting">Hello ${tenantName || 'Resident'},</div>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            We regret to inform you that your booking request for <strong>${pgTitle}</strong> could not be accommodated at this time.
          </p>
          ${
            reason
              ? `<div class="reason-box"><strong>Owner Message:</strong> ${reason}</div>`
              : ''
          }
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            You can explore many other verified accommodation options in the same area on PG Finder.
          </p>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} PG Finder. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await mailTransporter.sendMail({
      from: `"PG Finder Bookings" <${env.smtpUser}>`,
      to: toEmail,
      subject: `Booking Update: ${pgTitle}`,
      text: `Hello ${tenantName},\n\nYour booking request for "${pgTitle}" was declined.${reason ? ` Reason: ${reason}` : ''}\n\nPlease visit PG Finder to discover alternative listings.`,
      html: htmlContent,
    });
    console.log(`Booking rejection email delivered to ${toEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`Booking rejection email delivery error to ${toEmail}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

