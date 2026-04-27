const nodemailer = require("nodemailer");

const FROM_EMAIL = process.env.FROM_EMAIL || "some@example.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const PAYMENT_EMAIL = process.env.PAYMENT_EMAIL || "payment@example.com";

// Create transporter using sendmail (available on shared hosting)
const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: "unix",
  path: "/usr/sbin/sendmail",
});

function formatMoney(value) {
  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return "0.00";
  }
  return numericValue.toFixed(2);
}

function formatDisplayValue(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : "N/A";
}

function getOrderPresentation(order) {
  const productType = formatDisplayValue(order.productType || "Shirt");
  const nameOnProduct = formatDisplayValue(
    order.productName || order.shirtName,
  );
  const productCategory = formatDisplayValue(
    order.productCategory || order.shirtType,
  );
  const productSize = formatDisplayValue(order.productSize || order.shirtSize);
  const customerName = formatDisplayValue(order.name);
  const customerEmail = formatDisplayValue(order.email);
  const customerPhone = formatDisplayValue(order.phone);
  const customerAddress = formatDisplayValue(order.address);
  const customerCity = formatDisplayValue(order.city);
  const customerPostalCode = formatDisplayValue(order.postalCode);

  return {
    productType,
    nameOnProduct,
    productCategory,
    productSize,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerCity,
    customerPostalCode,
    customerAddressLine:
      customerAddress === "N/A" &&
      customerCity === "N/A" &&
      customerPostalCode === "N/A"
        ? "N/A"
        : `${customerAddress}, ${customerCity} ${customerPostalCode}`,
  };
}

// Email templates
const orderConfirmationTemplate = (order) => {
  const { productType, nameOnProduct, productCategory, productSize } =
    getOrderPresentation(order);

  return {
    subject: `Order Confirmation #${order.id} - MBA of BC ${productType}`,
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
            <td style="padding: 8px; font-weight: bold;">Name on ${productType}:</td>
            <td style="padding: 8px;">${nameOnProduct}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">${productType} Type:</td>
            <td style="padding: 8px;">${productCategory}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Size:</td>
            <td style="padding: 8px;">${productSize}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd; padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Quantity:</td>
            <td style="padding: 8px;">${order.quantity}</td>
          </tr>
          <tr style="padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Total Amount:</td>
            <td style="padding: 8px; font-weight: bold; color: #0066cc;">$${formatMoney(order.totalAmount)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;">
        <h3>Next Steps - Payment Required</h3>
        <p><strong>Please send your e-transfer payment</strong> to complete your order:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Send e-transfer to: <strong>${PAYMENT_EMAIL}</strong></li>
          <li>Use <strong>"${productType} Order #${order.id} - ${order.name}"</strong> as the payment note/reference</li>
          <li>Keep this confirmation until payment is complete</li>
        </ul>
      </div>

      <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated confirmation email. If you have any questions, please contact us at ${ADMIN_EMAIL}</p>
        <p>Master Bowlers Association of BC</p>
      </div>
    </div>
  `,
    text: `
Order Confirmation #${order.id}

Thank you for placing your order with Master Bowlers Association of BC!

ORDER DETAILS:
Order #: ${order.id}
Name on ${productType}: ${nameOnProduct}
${productType} Type: ${productCategory}
Size: ${productSize}
Quantity: ${order.quantity}
Total Amount: $${formatMoney(order.totalAmount)}

NEXT STEPS - PAYMENT REQUIRED:
Please send your e-transfer payment to complete your order:
1. Send e-transfer to: ${PAYMENT_EMAIL}
2. Use "${productType} Order #${order.id} - ${order.name}" as the payment note/reference
3. Keep this confirmation until payment is complete

If you have any questions, please contact us at ${ADMIN_EMAIL}

Master Bowlers Association of BC
  `,
  };
};

const orderAdminNotificationTemplate = (order) => {
  const {
    productType,
    nameOnProduct,
    productCategory,
    productSize,
    customerName,
    customerEmail,
    customerPhone,
    customerAddressLine,
  } = getOrderPresentation(order);

  return {
    subject: `New ${productType} Order Received #${order.id} - ${nameOnProduct}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New ${productType} Order Received</h2>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Customer Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Order #:</td>
            <td style="padding: 8px;">${order.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Name:</td>
            <td style="padding: 8px;">${customerName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;">${customerEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Phone:</td>
            <td style="padding: 8px;">${customerPhone}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Address:</td>
            <td style="padding: 8px;">${customerAddressLine}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Name on ${productType}:</td>
            <td style="padding: 8px;">${nameOnProduct}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">${productType} Type:</td>
            <td style="padding: 8px;">${productCategory}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Size:</td>
            <td style="padding: 8px;">${productSize}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Quantity:</td>
            <td style="padding: 8px;">${order.quantity}</td>
          </tr>
          <tr style="padding: 10px 0;">
            <td style="padding: 8px; font-weight: bold;">Total:</td>
            <td style="padding: 8px; font-weight: bold; color: #0066cc;">$${formatMoney(order.totalAmount)}</td>
          </tr>
        </table>
      </div>

      <p style="color: #666; font-size: 12px;">Awaiting payment at ${PAYMENT_EMAIL}</p>
    </div>
  `,
    text: `
New ${productType} Order Received - Order #${order.id}

CUSTOMER INFORMATION:
Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}
Address: ${customerAddressLine}

ORDER DETAILS:
Name on ${productType}: ${nameOnProduct}
${productType} Type: ${productCategory}
Size: ${productSize}
Quantity: ${order.quantity}
Total: $${formatMoney(order.totalAmount)}

Status: Awaiting payment at ${PAYMENT_EMAIL}
  `,
  };
};

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
 * Send order notification to admin
 */
const sendOrderNotification = async (order, adminEmail = null) => {
  const recipient = adminEmail || ADMIN_EMAIL;
  try {
    const template = orderAdminNotificationTemplate(order);
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: recipient,
      ...template,
    });
    console.log(`Order notification sent to ${recipient}`);
    return true;
  } catch (error) {
    console.error(`Failed to send order notification to ${recipient}:`, error);
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
  sendOrderNotification,
  testEmailConnection,
};
