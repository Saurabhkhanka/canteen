import nodemailer from 'nodemailer';

// Simple HTML escaping helper for XSS prevention in email rendering
const escapeHTML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

interface IOrderItemSnapshot {
  name: string;
  quantity: number;
  price: number;
}

interface ISendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Low-level email sending helper
export const sendEmail = async (options: ISendEmailOptions): Promise<void> => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'canteen@college.edu';

  // Fallback to local simulation if SMTP details are missing
  if (!host || !user || !pass) {
    console.log('\n===== 📧 SIMULATED EMAIL DISPATCH =====');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('--- HTML Receipt Content ---');
    console.log(options.html);
    console.log('========================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Use TLS for 465, STARTTLS otherwise
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `"Canteen Service" <${from}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

// High-level wrapper to send order confirmation emails
export const sendOrderConfirmationEmail = async (
  studentEmail: string,
  studentName: string,
  orderId: string,
  items: IOrderItemSnapshot[],
  totalPrice: number
): Promise<void> => {
  const escapedName = escapeHTML(studentName);
  const escapedOrderId = escapeHTML(orderId);

  // Generate order items rows dynamically with XSS escaping
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">${escapeHTML(item.name)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; color: #333333;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e9e9e9;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Canteen Order Confirmed</h1>
              <p style="color: #e0f2fe; margin: 5px 0 0 0; font-size: 14px;">Thank you for your order!</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">Hi <strong>${escapedName}</strong>,</p>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #555555;">
                Your order has been received and is currently being processed. Show the Order ID below at the canteen counter to pick up your food once it is ready.
              </p>
              
              <!-- Order Details Summary Box -->
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">Order ID</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; font-family: monospace; color: #111827;">${escapedOrderId}</p>
              </div>

              <!-- Items Table -->
              <table cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; margin-bottom: 25px; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total Price Section -->
              <table cellpadding="0" cellspacing="0" width="100%" style="font-size: 16px; font-weight: bold; border-top: 2px solid #eeeeee; padding-top: 15px;">
                <tr>
                  <td style="text-align: left; color: #111827;">Grand Total:</td>
                  <td style="text-align: right; color: #4f46e5; font-size: 18px;">₹${totalPrice.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eeeeee; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 5px 0;">Campus Canteen Automation System</p>
              <p style="margin: 0;">If you have any issues with your order, please visit the canteen manager counter.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail({
    to: studentEmail,
    subject: `Canteen Order Confirmation - ID: ${escapedOrderId}`,
    html: emailHtml,
  });
};
