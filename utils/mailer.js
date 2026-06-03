import nodemailer from "nodemailer";
import mailTemplates from "../models/mailTemplate.js";

let transporter;
const templateCache = new Map();

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP credentials are not configured");
  }

  transporter = nodemailer.createTransport({
    pool: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    maxConnections: 2,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

function applyTemplateVariables(value = "", variables = {}) {
  return Object.entries(variables).reduce((result, [key, replacement]) => {
    return result?.replaceAll(key, replacement);
  }, value);
}

export const sendMail = async (templateName, mailVariables, email) => {
  let template = templateCache.get(templateName);

  if (!template) {
    template = await mailTemplates
      .findOne({
        templateEvent: templateName,
        isDeleted: false,
        active: true,
      })
      .lean(true);

    if (template) {
      templateCache.set(templateName, template);
    }
  }

  if (!template || (!template.subject && !template.htmlBody && !template.textBody)) {
    throw new Error(`Mail template not found: ${templateName}`);
  }

  const subject = applyTemplateVariables(template.subject, mailVariables);
  const html = applyTemplateVariables(template.htmlBody, mailVariables);
  const text = applyTemplateVariables(template.textBody, mailVariables);

  await getTransporter().sendMail({
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: subject || "Portfolio Builder",
    text: text || "",
    html: html || text || "",
  });

  return {
    type: "success",
    message: "Mail successfully sent",
  };
};

export const sendRawMail = async ({ to, replyTo, subject, text, html }) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_EMAIL,
    to,
    replyTo,
    subject: subject || "Portfolio message",
    text: text || "",
    html: html || "",
  });

  return {
    type: "success",
    message: "Mail successfully sent",
  };
};
