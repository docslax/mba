const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const FROM_EMAIL = process.env.FROM_EMAIL || "some@example.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const PAYMENT_EMAIL = process.env.PAYMENT_EMAIL || "payment@example.com";

// Lazy transporter — set EMAIL_TRANSPORT=ethereal in .env to capture emails locally.
// A preview URL will be logged to the console after each send.
let _transporter = null;

const getTransporter = async () => {
  if (_transporter) return _transporter;

  if (process.env.EMAIL_TRANSPORT === "ethereal") {
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    _transporter = nodemailer.createTransport({
      sendmail: true,
      newline: "unix",
      path: "/usr/sbin/sendmail",
    });
  }

  return _transporter;
};

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

function getSubmissionKind(order) {
  const productType = formatDisplayValue(order.productType).toLowerCase();
  return productType === "membership" ? "application" : "order";
}

function renderTableRows(rows) {
  return rows
    .map((row, index) => {
      const isLast = index === rows.length - 1;
      const rowStyle = isLast ? "" : "border-bottom: 1px solid #ddd;";
      const valueStyle = row.highlight
        ? "font-weight: bold; color: #0066cc;"
        : "";

      return `
        <tr style="${rowStyle}">
          <td style="padding: 8px; font-weight: bold;">${row.label}</td>
          <td style="padding: 8px; ${valueStyle}">${row.value}</td>
        </tr>
      `;
    })
    .join("");
}

function renderDataPanel(title, rows) {
  return `
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3>${title}</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${renderTableRows(rows)}
      </table>
    </div>
  `;
}

function renderCalloutPanel(title, intro, items) {
  const listItems = items.map((item) => `<li>${item}</li>`).join("");
  return `
    <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;">
      <h3>${title}</h3>
      <p><strong>${intro}</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">${listItems}</ul>
    </div>
  `;
}

function renderListPanel(title, items) {
  const safeItems = items.length > 0 ? items : ["N/A"];
  const listItems = safeItems.map((item) => `<li>${item}</li>`).join("");
  return `
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3>${title}</h3>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">${listItems}</ul>
    </div>
  `;
}

function renderEmailFooter() {
  return `
    <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px; color: #666; font-size: 12px;">
      <p>This is an automated confirmation email. If you have any questions, please contact us at ${ADMIN_EMAIL}</p>
      <p>Master Bowlers Association of BC</p>
    </div>
  `;
}

function renderEmailHtml({ heading, intro, panels, callout, bottomNote }) {
  const sections = panels.join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${heading}</h2>
      <p>${intro}</p>
      ${sections}
      ${callout || ""}
      ${bottomNote ? `<p style="color: #666; font-size: 12px;">${bottomNote}</p>` : ""}
      ${renderEmailFooter()}
    </div>
  `;
}

function renderTextSection(title, lines) {
  return `${title}:\n${lines.join("\n")}`;
}

function parseApplicationDetails(productCategory) {
  if (productCategory === "N/A") {
    return ["N/A"];
  }

  const rawParts = String(productCategory)
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  const expanded = [];
  rawParts.forEach((part) => {
    if (
      /^Coaching\s*:/i.test(part) ||
      /^Playing multiple divisions\s*:/i.test(part)
    ) {
      return;
    }

    if (part.startsWith("Participant:")) {
      const participantValues = part
        .replace("Participant:", "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      participantValues.forEach((value, index) => {
        expanded.push(index === 0 ? `Participant: ${value}` : value);
      });
      return;
    }

    if (part.startsWith("Non-participant:")) {
      const nonParticipantValues = part
        .replace("Non-participant:", "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      nonParticipantValues.forEach((value, index) => {
        expanded.push(index === 0 ? `Non-participant: ${value}` : value);
      });
      return;
    }

    expanded.push(part);
  });

  return expanded.length > 0 ? expanded : ["N/A"];
}

function renderDetailListValue(items) {
  const safeItems = items.length > 0 ? items : ["N/A"];
  const listItems = safeItems.map((item) => `<li>${item}</li>`).join("");
  return `<ul style="margin: 0; padding-left: 20px;">${listItems}</ul>`;
}

function renderTextEmail({ heading, intro, sections, nextSteps, closing }) {
  return `
${heading}

${intro}

${sections.join("\n\n")}

${nextSteps}

${closing}
  `;
}

function formatDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSubmissionPdf(order) {
  const kind = getSubmissionKind(order);
  const {
    productCategory,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerCity,
    customerPostalCode,
  } = getOrderPresentation(order);

  if (kind !== "application") {
    return Promise.reject(
      new Error(
        "Only membership applications are supported for PDF generation",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margin: 35,
        bufferPages: true,
      });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("MASTER BOWLERS ASSOCIATION", { align: "center" });
      doc.fontSize(14).text("OF BRITISH COLUMBIA", { align: "center" });
      doc
        .fontSize(11)
        .font("Helvetica")
        .text("2026/2027 Membership Application Form", { align: "center" });
      doc.moveDown(1.2);

      // Instructions
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(
          "Complete this form in order: provide your contact and qualification details, select a membership category, choose any tournament prepayment options, sign the applicable declarations, and calculate the total payment due.",
          { width: 525 },
        );
      doc.moveDown(1.2);

      // Personal and Membership Information
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Personal and Membership Information");
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");
      doc.text(
        `Name: ${customerName}${" ".repeat(20)}Email: ${customerEmail}${" ".repeat(10)}Phone No. ${customerPhone}`,
      );
      doc.text(
        `Address: ${customerAddress}${" ".repeat(10)}City: ${customerCity}${" ".repeat(10)}Postal Code: ${customerPostalCode}`,
      );
      doc.moveDown(1.2);

      // Parse details
      const details = parseApplicationDetails(productCategory);
      const membershipLines = [];
      const prepayLines = [];
      const seniorsPrepayLine = [];
      const tournamentPrepayLine = [];

      details.forEach((detail) => {
        if (/senior.*prepay|poa.*prepay/i.test(detail)) {
          seniorsPrepayLine.push(detail);
        } else if (/tournament.*prepay/i.test(detail)) {
          tournamentPrepayLine.push(detail);
        } else if (/prepay/i.test(detail)) {
          prepayLines.push(detail);
        } else if (detail.trim()) {
          membershipLines.push(detail);
        }
      });

      // Membership Fees for Participants
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000");
      doc.text("Membership Fees for Participants");
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");

      // Show selected membership options
      membershipLines.forEach((line) => {
        const cleaned = line.replace(/^\s*[\&\-]\s*/, "").trim();
        if (cleaned) {
          doc.text(`[X] ${cleaned}`);
        }
      });
      doc.moveDown(1.2);

      // Prepay Tournament Entry Fees POA/Seniors
      if (seniorsPrepayLine.length > 0) {
        doc.text(
          "Prepay Tournament Entry Fees POA/Seniors    [X] Yes    [ ] No",
        );
        doc.moveDown(0.3);
        seniorsPrepayLine.forEach((line) => {
          const cleaned = line
            .replace(/prepay|seniors|poa/gi, "")
            .replace(/^\s*[\&\-]\s*/, "")
            .trim();
          if (cleaned) {
            doc.text(`    ${cleaned}`);
          }
        });
        doc.moveDown(0.2);
        doc
          .fontSize(8)
          .fillColor("#FF0000")
          .text("Prepay for 5 and get one entry free ($160)");
        doc.fontSize(9).fillColor("#000000");
        doc.moveDown(1.2);
      }

      // Prepay Tournament Entry Fees Tournament
      if (tournamentPrepayLine.length > 0) {
        doc.text(
          "Prepay Tournament Entry Fees Tournament    [X] Yes    [ ] No",
        );
        doc.moveDown(0.3);
        tournamentPrepayLine.forEach((line) => {
          const cleaned = line
            .replace(/prepay|tournament/gi, "")
            .replace(/^\s*[\&\-]\s*/, "")
            .trim();
          if (cleaned) {
            doc.text(`    ${cleaned}`);
          }
        });
        doc.moveDown(0.2);
        doc
          .fontSize(8)
          .fillColor("#FF0000")
          .text("Prepay for 6 and get one entry free ($200)");
        doc.fontSize(9).fillColor("#000000");
        doc.moveDown(1.2);
      }

      // Declaration
      doc.text(
        "I decline to play Tournament singles at Nationals if I qualify for same.    Signature: _____________________ (Digitally Submitted)",
      );
      doc.moveDown(1.2);

      // Membership Fees for Non-Participants
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Membership Fees for Non-Participants");
      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(
          "[ ] $65 Associate Member    [ ] $65 Teach Only    [ ] $30 Lifetime Member",
        );
      doc.moveDown(1.2);

      // Agreement
      doc
        .fontSize(9)
        .text(
          "I have read and agree to abide by the rules of the Master Bowlers Association of BC and the decisions made by the Board of Directors.",
        );
      doc.moveDown(0.3);
      doc.text(
        "Signature: ____________________________    Date: __________________________ (Digitally Submitted)",
      );
      doc.moveDown(1.2);

      // Notes
      doc
        .fontSize(8)
        .text(
          "If you join more than one Division, you are required to pay entry fees for each Division.",
        );
      doc.text(
        "Note first time Participants in either POA or Senior Divisions will be required to provide verification of averages for all leagues for 2025/2026 season",
      );
      doc.moveDown(1.2);

      // Payment Methods
      doc.fontSize(9).font("Helvetica-Bold").text("Payment Methods accepted:");
      doc.fontSize(8).font("Helvetica");
      doc.text(
        "Cheque, Cash (in person only), E-Transfer to: MBAofBC.payments@gmail.com     All membership Dues must be paid by December 31, 2026.",
      );
      doc.text(
        "NSF cheque Policy: Replacement NSF cheque will require an additional $25.00.",
      );
      doc.text(
        "All membership forms to be sent to Master Bowlers Association of B.C. Attention: Lillian Jewell 10793 Erskin St., Maple Ridge, BC V2W 0E9 or email to lilinator@hotmail.ca",
      );
      doc.moveDown(1.2);

      // Payment Summary
      doc.fontSize(11).font("Helvetica-Bold").text("Payment Summary");
      doc.moveDown(0.7);
      doc.fontSize(9).font("Helvetica");

      const totalAmount = Number.parseFloat(order.totalAmount) || 0;
      const prepayTotal = Number.parseFloat(order.prepayTotal) || 0;
      const membershipFees = Math.max(0, totalAmount - prepayTotal);

      doc.text(`Membership Fees $${formatMoney(membershipFees)}`);
      doc.moveDown(0.3);

      if (prepayTotal > 0) {
        doc.text(`Entry Prepayment $${formatMoney(prepayTotal)}`);
        doc.moveDown(0.3);
      }

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text(`Total Paid $${formatMoney(totalAmount)}`);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function buildOrderCustomerTemplate(order) {
  const { productType, nameOnProduct, productCategory, productSize } =
    getOrderPresentation(order);
  const paymentReference = `${productType} Order #${order.id} - ${order.name}`;

  return {
    subject: `Order Confirmation #${order.id} - MBA of BC ${productType}`,
    html: renderEmailHtml({
      heading: "Order Confirmation",
      intro:
        "Thank you for placing your order with Master Bowlers Association of BC!",
      panels: [
        renderDataPanel("Order Details", [
          { label: "Order #:", value: order.id },
          { label: `Name on ${productType}:`, value: nameOnProduct },
          { label: `${productType} Type:`, value: productCategory },
          { label: "Size:", value: productSize },
          { label: "Quantity:", value: order.quantity },
          {
            label: "Total Amount:",
            value: `$${formatMoney(order.totalAmount)}`,
            highlight: true,
          },
        ]),
      ],
      callout: renderCalloutPanel(
        "Next Steps - Payment Required",
        "Please send your e-transfer payment to complete your order:",
        [
          `Send e-transfer to: <strong>${PAYMENT_EMAIL}</strong>`,
          `Use <strong>\"${paymentReference}\"</strong> as the payment note/reference`,
          "Keep this confirmation until payment is complete",
        ],
      ),
    }),
    text: renderTextEmail({
      heading: `Order Confirmation #${order.id}`,
      intro:
        "Thank you for placing your order with Master Bowlers Association of BC!",
      sections: [
        renderTextSection("ORDER DETAILS", [
          `Order #: ${order.id}`,
          `Name on ${productType}: ${nameOnProduct}`,
          `${productType} Type: ${productCategory}`,
          `Size: ${productSize}`,
          `Quantity: ${order.quantity}`,
          `Total Amount: $${formatMoney(order.totalAmount)}`,
        ]),
      ],
      nextSteps: renderTextSection("NEXT STEPS - PAYMENT REQUIRED", [
        "Please send your e-transfer payment to complete your order:",
        `1. Send e-transfer to: ${PAYMENT_EMAIL}`,
        `2. Use \"${paymentReference}\" as the payment note/reference`,
        "3. Keep this confirmation until payment is complete",
      ]),
      closing: `If you have any questions, please contact us at ${ADMIN_EMAIL}\n\nMaster Bowlers Association of BC`,
    }),
  };
}

function buildOrderAdminTemplate(order) {
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
    html: renderEmailHtml({
      heading: `New ${productType} Order Received`,
      intro: "A new order has been submitted.",
      panels: [
        renderDataPanel("Customer Information", [
          { label: "Order #:", value: order.id },
          { label: "Name:", value: customerName },
          { label: "Email:", value: customerEmail },
          { label: "Phone:", value: customerPhone },
          { label: "Address:", value: customerAddressLine },
        ]),
        renderDataPanel("Order Details", [
          { label: `Name on ${productType}:`, value: nameOnProduct },
          { label: `${productType} Type:`, value: productCategory },
          { label: "Size:", value: productSize },
          { label: "Quantity:", value: order.quantity },
          {
            label: "Total:",
            value: `$${formatMoney(order.totalAmount)}`,
            highlight: true,
          },
        ]),
      ],
      bottomNote: `Awaiting payment at ${PAYMENT_EMAIL}`,
    }),
    text: renderTextEmail({
      heading: `New ${productType} Order Received - Order #${order.id}`,
      intro: "A new order has been submitted.",
      sections: [
        renderTextSection("CUSTOMER INFORMATION", [
          `Name: ${customerName}`,
          `Email: ${customerEmail}`,
          `Phone: ${customerPhone}`,
          `Address: ${customerAddressLine}`,
        ]),
        renderTextSection("ORDER DETAILS", [
          `Name on ${productType}: ${nameOnProduct}`,
          `${productType} Type: ${productCategory}`,
          `Size: ${productSize}`,
          `Quantity: ${order.quantity}`,
          `Total: $${formatMoney(order.totalAmount)}`,
        ]),
      ],
      nextSteps: `Status: Awaiting payment at ${PAYMENT_EMAIL}`,
      closing: "",
    }),
  };
}

function buildApplicationCustomerTemplate(order) {
  const { productType, productCategory, customerName } =
    getOrderPresentation(order);
  const paymentReference = `Membership Application #${order.id} - ${order.name}`;
  const applicationDetails = parseApplicationDetails(productCategory);
  const applicationDetailsListHtml = renderDetailListValue(applicationDetails);

  return {
    subject: `Application Confirmation #${order.id} - MBA of BC ${productType}`,
    html: renderEmailHtml({
      heading: "Application Confirmation",
      intro:
        "Thank you for submitting your application to Master Bowlers Association of BC!",
      panels: [
        renderDataPanel("Application Details", [
          { label: "Application #:", value: order.id },
          { label: "Application Type:", value: productType },
          { label: "Details:", value: applicationDetailsListHtml },
          {
            label: "Total Amount:",
            value: `$${formatMoney(order.totalAmount)}`,
            highlight: true,
          },
        ]),
      ],
      callout: renderCalloutPanel(
        "Next Steps - Payment Required",
        "Please send your e-transfer payment to complete your application:",
        [
          `Send e-transfer to: <strong>${PAYMENT_EMAIL}</strong>`,
          `Use <strong>\"${paymentReference}\"</strong> as the payment note/reference`,
          "Keep this confirmation until payment is complete",
        ],
      ),
    }),
    text: renderTextEmail({
      heading: `Application Confirmation #${order.id}`,
      intro:
        "Thank you for submitting your application to Master Bowlers Association of BC!",
      sections: [
        renderTextSection("APPLICATION DETAILS", [
          `Application Type: ${productType}`,
          `Total Amount: $${formatMoney(order.totalAmount)}`,
        ]),
        renderTextSection(
          "DETAILS",
          applicationDetails.map((detail) => `- ${detail}`),
        ),
      ],
      nextSteps: renderTextSection("NEXT STEPS - PAYMENT REQUIRED", [
        "Please send your e-transfer payment to complete your application:",
        `1. Send e-transfer to: ${PAYMENT_EMAIL}`,
        `2. Use \"${paymentReference}\" as the payment note/reference`,
        "3. Keep this confirmation until payment is complete",
      ]),
      closing: `If you have any questions, please contact us at ${ADMIN_EMAIL}\n\nMaster Bowlers Association of BC`,
    }),
  };
}

function buildApplicationAdminTemplate(order) {
  const {
    productType,
    productCategory,
    customerName,
    customerEmail,
    customerPhone,
    customerAddressLine,
  } = getOrderPresentation(order);
  const applicationDetails = parseApplicationDetails(productCategory);
  const applicationDetailsListHtml = renderDetailListValue(applicationDetails);

  return {
    subject: `New ${productType} Application Received #${order.id} - ${customerName}`,
    html: renderEmailHtml({
      heading: `New ${productType} Application Received`,
      intro: "A new application has been submitted.",
      panels: [
        renderDataPanel("Applicant Information", [
          { label: "Name:", value: customerName },
          { label: "Email:", value: customerEmail },
          { label: "Phone:", value: customerPhone },
          { label: "Address:", value: customerAddressLine },
        ]),
        renderDataPanel("Application Details", [
          { label: "Application #:", value: order.id },
          { label: "Application Type:", value: productType },
          { label: "Details:", value: applicationDetailsListHtml },
          {
            label: "Total:",
            value: `$${formatMoney(order.totalAmount)}`,
            highlight: true,
          },
        ]),
      ],
      bottomNote: `Awaiting payment at ${PAYMENT_EMAIL}`,
    }),
    text: renderTextEmail({
      heading: `New ${productType} Application Received - Application #${order.id}`,
      intro: "A new application has been submitted.",
      sections: [
        renderTextSection("APPLICANT INFORMATION", [
          `Name: ${customerName}`,
          `Email: ${customerEmail}`,
          `Phone: ${customerPhone}`,
          `Address: ${customerAddressLine}`,
        ]),
        renderTextSection("APPLICATION DETAILS", [
          `Application Type: ${productType}`,
          `Total: $${formatMoney(order.totalAmount)}`,
        ]),
        renderTextSection(
          "DETAILS",
          applicationDetails.map((detail) => `- ${detail}`),
        ),
      ],
      nextSteps: `Status: Awaiting payment at ${PAYMENT_EMAIL}`,
      closing: "",
    }),
  };
}

const emailTemplateMap = {
  order: {
    customer: buildOrderCustomerTemplate,
    admin: buildOrderAdminTemplate,
  },
  application: {
    customer: buildApplicationCustomerTemplate,
    admin: buildApplicationAdminTemplate,
  },
};

function getEmailTemplate(order, audience) {
  const kind = getSubmissionKind(order);
  const templateBuilder = emailTemplateMap[kind][audience];
  return templateBuilder(order);
}

/**
 * Send order confirmation email to customer
 */
const sendOrderConfirmation = async (order) => {
  const submissionKind = getSubmissionKind(order);
  try {
    const t = await getTransporter();
    const template = getEmailTemplate(order, "customer");
    let attachments = [];

    try {
      const pdfBuffer = await buildSubmissionPdf(order);
      attachments = [
        {
          filename: `${submissionKind}-${order.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    } catch (pdfError) {
      console.error(
        `Failed to build ${submissionKind} PDF for ${order.id}:`,
        pdfError,
      );
    }

    const info = await t.sendMail({
      from: FROM_EMAIL,
      to: order.email,
      attachments,
      ...template,
    });
    console.log(`${submissionKind} confirmation sent to ${order.email}`);
    if (process.env.EMAIL_TRANSPORT === "ethereal") {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error(
      `Failed to send ${submissionKind} confirmation email to ${order.email}:`,
      error,
    );
    return false;
  }
};

/**
 * Send order notification to admin
 */
const sendOrderNotification = async (order, adminEmail = null) => {
  const submissionKind = getSubmissionKind(order);
  const recipient = adminEmail || ADMIN_EMAIL;
  try {
    const t = await getTransporter();
    const template = getEmailTemplate(order, "admin");
    let attachments = [];

    try {
      const pdfBuffer = await buildSubmissionPdf(order);
      attachments = [
        {
          filename: `${submissionKind}-${order.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    } catch (pdfError) {
      console.error(
        `Failed to build ${submissionKind} PDF for ${order.id}:`,
        pdfError,
      );
    }

    const info = await t.sendMail({
      from: FROM_EMAIL,
      to: recipient,
      attachments,
      ...template,
    });
    console.log(`${submissionKind} notification sent to ${recipient}`);
    if (process.env.EMAIL_TRANSPORT === "ethereal") {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error(
      `Failed to send ${submissionKind} notification to ${recipient}:`,
      error,
    );
    return false;
  }
};

/**
 * Test email connectivity
 */
const testEmailConnection = async () => {
  try {
    const t = await getTransporter();
    await t.verify();
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
