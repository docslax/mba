const nodemailer = require("nodemailer");

const FROM_EMAIL = process.env.FROM_EMAIL || "forms@mbaofbc.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "MBAofBC.shirts@gmail.com";

// Create transporter using sendmail (available on shared hosting)
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: "unix",
  path: "/usr/sbin/sendmail",
});

// Email templates
const orderConfirmationTemplate = (order) => ({
  subject: `Order Confirmation #${order.id} - MBA of BC Golf Shirt`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Order Confirmation</h2>
      <p>Thank you for placing your order with Master Bowlers Association of BC!</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Order #:</td>
            <td style="padding: 8px;">${order.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Name on Shirt:</td>
            <td style="padding: 8px;">${order.shirtName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Shirt Type:</td>
            <td style="padding: 8px;">${order.shirtType}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Size:</td>
            <td style="padding: 8px;">${order.shirtSize}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Quantity:</td>
            <td style="padding: 8px;">${order.quantity}</td>
          </tr>
          <tr style="padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Total Amount:</td>
            <td style="padding: 8px; font-weight: bold; color: #0066cc;">$${order.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;">
        <h3>Next Steps - Payment Required</h3>
        <p><strong>Please send your e-transfer payment</strong> to complete your order:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Send e-transfer to: <strong>MBAofBC.payments@gmail.com</strong></li>
          <li>Use <strong>"Order #${order.id}"</strong> as the payment note/reference</li>
          <li>Keep this confirmation until payment is complete</li>
        </ul>
      </div>

      <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated confirmation email. If you have any questions, please contact us at MBAofBC.shirts@gmail.com</p>
        <p>Master Bowlers Association of BC</p>
      </div>
    </div>
  `,
  text: `
Order Confirmation #${order.id}

Thank you for placing your order with Master Bowlers Association of BC!

ORDER DETAILS:
Order #: ${order.id}
Name on Shirt: ${order.shirtName}
Shirt Type: ${order.shirtType}
Size: ${order.shirtSize}
Quantity: ${order.quantity}
Total Amount: $${order.totalAmount.toFixed(2)}

NEXT STEPS - PAYMENT REQUIRED:
Please send your e-transfer payment to complete your order:
1. Send e-transfer to: MBAofBC.payments@gmail.com
2. Use "Order #${order.id}" as the payment note/reference
3. Keep this confirmation until payment is complete

If you have any questions, please contact us at MBAofBC.shirts@gmail.com

Master Bowlers Association of BC
  `,
});

const orderAdminNotificationTemplate = (order) => ({
  subject: `New Order Received #${order.id} - ${order.shirtName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Order Received</h2>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Customer Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Order #:</td>
            <td style="padding: 8px;">${order.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Name:</td>
            <td style="padding: 8px;">${order.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;">${order.email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Phone:</td>
            <td style="padding: 8px;">${order.phone}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Address:</td>
            <td style="padding: 8px;">${order.address}, ${order.city} ${order.postalCode}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Name on Shirt:</td>
            <td style="padding: 8px;">${order.shirtName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Type:</td>
            <td style="padding: 8px;">${order.shirtType}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Size:</td>
            <td style="padding: 8px;">${order.shirtSize}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Quantity:</td>
            <td style="padding: 8px;">${order.quantity}</td>
          </tr>
          <tr style="padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Total:</td>
            <td style="padding: 8px; font-weight: bold; color: #0066cc;">$${order.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <p style="color: #666; font-size: 12px;">Awaiting payment at MBAofBC.payments@gmail.com</p>
    </div>
  `,
  text: `
New Order Received - Order #${order.id}

CUSTOMER INFORMATION:
Name: ${order.name}
Email: ${order.email}
Phone: ${order.phone}
Address: ${order.address}, ${order.city} ${order.postalCode}

ORDER DETAILS:
Name on Shirt: ${order.shirtName}
Type: ${order.shirtType}
Size: ${order.shirtSize}
Quantity: ${order.quantity}
Total: $${order.totalAmount.toFixed(2)}

Status: Awaiting payment at MBAofBC.payments@gmail.com
  `,
});

/**
 * Send order confirmation email to customer
 */
const sendOrderConfirmation = async (order) => {
  try {
    const template = orderConfirmationTemplate(order);
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.email,
      ...template,
    });
    console.log(`Order confirmation sent to ${order.email}`);
    return true;
  } catch (error) {
    console.error(
      `Failed to send confirmation email to ${order.email}:`,
      error,
    );
    return false;
  }
};

/**
 * Send admin notification about new order
 */
const sendAdminNotification = async (order, adminEmail = null) => {
  const recipient = adminEmail || ADMIN_EMAIL;
  try {
    const template = orderAdminNotificationTemplate(order);
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipient,
      ...template,
    });
    console.log(`Admin notification sent to ${recipient}`);
    return true;
  } catch (error) {
    console.error(`Failed to send admin notification to ${recipient}:`, error);
    return false;
  }
};

/**
 * Test email connectivity
 */
const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email service is ready to send messages");
    return true;
  } catch (error) {
    console.error("Email service error:", error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmation,
  sendAdminNotification,
  testEmailConnection,
};
