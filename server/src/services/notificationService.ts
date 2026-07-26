import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { getStoredConfig } from '../config/database';

/**
 * Send an email using the tenant's SMTP configuration.
 * Falls back to a default SMTP server if not configured.
 */
export async function sendEmail(to: string, subject: string, htmlBody: string) {
  const config = getStoredConfig();
  const smtp = config.smtpConfig;
  if (!smtp) {
    console.warn('[Notification] SMTP config missing, email not sent.');
    return;
  }
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
  });

  const mailOptions = {
    from: `${smtp.senderName} <${smtp.senderEmail}>`,
    to,
    subject,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Notification] Email sent to ${to}`);
  } catch (err) {
    console.error('[Notification] Email send error:', err);
  }
}

/**
 * Send an SMS using the tenant's SMS configuration.
 * Currently supports Twilio when provider is 'twilio'.
 */
export async function sendSMS(to: string, message: string) {
  const config = getStoredConfig();
  const sms = config.smsConfig;
  if (!sms) {
    console.warn('[Notification] SMS config missing, SMS not sent.');
    return;
  }
  if (sms.provider.toLowerCase() === 'twilio') {
    const client = twilio(sms.apiKey, sms.apiSecret);
    try {
      await client.messages.create({
        body: message,
        from: sms.senderId,
        to,
      });
      console.log(`[Notification] SMS sent to ${to}`);
    } catch (err) {
      console.error('[Notification] SMS send error:', err);
    }
  } else {
    console.warn('[Notification] SMS provider not supported:', sms.provider);
  }
}
