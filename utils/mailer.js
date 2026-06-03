import nodemailer from "nodemailer";
import mailTemplates from "../models/mailTemplate.js";

function createTransporter() {
  return nodemailer.createTransport({
    pool: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

function applyTemplateVariables(value = "", variables = {}) {
  return Object.entries(variables).reduce((result, [key, replacement]) => {
    return result?.replaceAll(key, replacement);
  }, value);
}

export const sendMail = async (templateName, mailVariables, email) => {
  const template = await mailTemplates
    .findOne({
      templateEvent: templateName,
      isDeleted: false,
      active: true,
    })
    .lean(true);

  if (!template || (!template.subject && !template.htmlBody && !template.textBody)) {
    throw new Error(`Mail template not found: ${templateName}`);
  }

  const subject = applyTemplateVariables(template.subject, mailVariables);
  const html = applyTemplateVariables(template.htmlBody, mailVariables);
  const text = applyTemplateVariables(template.textBody, mailVariables);

  await createTransporter().sendMail({
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

  await createTransporter().sendMail({
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
