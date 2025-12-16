const nodemailer = require('nodemailer');

// Create transporter
// Create transporter
const createTransporter = () => {
  // Check if SMTP credentials are provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // If no credentials, log email to console (Development Mode)
    return {
      sendMail: async (mailOptions) => {
        console.log('\n=== EMAIL SENT (Mock Mode - No SMTP Config) ===');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('HTML Preview:', mailOptions.html.substring(0, 100) + '...');
        console.log('===============================================\n');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }
};

/**
 * Send team invitation email
 */
const sendInvitationEmail = async (to, name, organizationName, role, token) => {
  try {
    const transporter = createTransporter();
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const invitationLink = `${frontendUrl}/accept-invitation/${token}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@samaaroh.com',
      to: to,
      subject: `You've been invited to join ${organizationName} on Samaaroh`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Samaaroh</h1>
              <p style="margin: 10px 0 0 0;">Wedding Planning Platform</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>You've been invited to join <strong>${organizationName}</strong> on Samaaroh!</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>Your Role:</strong> ${role.replace('_', ' ')}</p>
              </div>
              
              <p>Click the button below to set your password and get started:</p>
              
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="${invitationLink}">${invitationLink}</a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Note:</strong> This invitation link will expire in 7 days.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Samaaroh. All rights reserved.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Invitation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
};

/**
 * Send password reset email (for future use)
 */
const sendPasswordResetEmail = async (to, name, token) => {
  try {
    const transporter = createTransporter();
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@samaaroh.com',
      to: to,
      subject: 'Reset Your Samaaroh Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Samaaroh</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password.</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetLink}">${resetLink}</a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Note:</strong> This link will expire in 1 hour.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Samaaroh. All rights reserved.</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

/**
 * Send invoice email
 */
const sendInvoiceEmail = async (invoice, recipientEmail, pdfPath) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@samaaroh.com',
      to: recipientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.organizationId?.name || 'Your Company'}`,
      html: getInvoiceEmailTemplate(invoice),
      attachments: pdfPath ? [{
        filename: `invoice_${invoice.invoiceNumber}.pdf`,
        path: pdfPath
      }] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

/**
 * Get invoice email HTML template
 */
const getInvoiceEmailTemplate = (invoice) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .invoice-row:last-child { border-bottom: none; }
        .label { color: #6b7280; font-weight: 600; }
        .value { color: #111827; font-weight: 600; }
        .total { background: #fbbf24; color: #111827; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Invoice from ${invoice.organizationId?.name || 'Your Company'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your business!</p>
        </div>
        
        <div class="content">
          <p>Dear ${invoice.clientId?.name || 'Valued Client'},</p>
          
          <p>Please find attached the invoice for your recent booking. Below is a summary:</p>
          
          <div class="invoice-details">
            <div class="invoice-row">
              <span class="label">Invoice Number:</span>
              <span class="value">${invoice.invoiceNumber}</span>
            </div>
            <div class="invoice-row">
              <span class="label">Invoice Date:</span>
              <span class="value">${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div class="invoice-row">
              <span class="label">Due Date:</span>
              <span class="value">${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span>
            </div>
            ${invoice.eventId ? `
            <div class="invoice-row">
              <span class="label">Event:</span>
              <span class="value">${invoice.eventId.eventName}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="total">
            Total Amount: ₹${invoice.total.toLocaleString('en-IN')}
          </div>
          
          ${invoice.balanceAmount > 0 ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>Amount Due: ₹${invoice.balanceAmount.toLocaleString('en-IN')}</strong>
          </div>
          ` : ''}
          
          <p>The complete invoice is attached to this email as a PDF document.</p>
          
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>${invoice.organizationId?.name || 'Your Company'}</strong><br>
            ${invoice.organizationId?.email || ''}<br>
            ${invoice.organizationId?.phone || ''}
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${invoice.organizationId?.name || 'Your Company'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendInvoiceEmail
};
