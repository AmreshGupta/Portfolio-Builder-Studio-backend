import nodemailer from "nodemailer";
import mailTemplates from "../models/mailTemplate.js";

let transporter = null;
let transporterConfigKey = "";
const templateCache = new Map();
const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000;

const getSmtpConfig = () => {
  const smtpEmail = process.env.SMTP_EMAIL?.trim();
  const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s/g, "");

  if (!smtpEmail || !smtpPassword) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD are required");
  }

  return { smtpEmail, smtpPassword };
};

const getTransporter = () => {
  const { smtpEmail, smtpPassword } = getSmtpConfig();
  const configKey = `${smtpEmail}:${smtpPassword}`;

  if (transporter && transporterConfigKey === configKey) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });
  transporterConfigKey = configKey;

  return transporter;
};

const getFromAddress = () => {
  const { smtpEmail } = getSmtpConfig();

  return `Portfolio Builder Studio <${smtpEmail}>`;
};

const getMailTemplate = async (templateName) => {
  const cached = templateCache.get(templateName);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.template;
  }

  const template = await mailTemplates
    .findOne({
      templateEvent: templateName,
      isDeleted: false,
      active: true,
    })
    .lean();

  if (!template) {
    throw new Error(`Mail template not found: ${templateName}`);
  }

  templateCache.set(templateName, {
    template,
    expiresAt: Date.now() + TEMPLATE_CACHE_TTL_MS,
  });

  return template;
};

const renderTemplate = (template, mailVariables = {}) => {
  let subject = template.subject || "";
  let html = template.htmlBody || "";
  let text = template.textBody || "";

  for (const key in mailVariables) {
    const value = mailVariables[key] ?? "";
    subject = subject.replaceAll(key, value);
    html = html.replaceAll(key, value);
    text = text.replaceAll(key, value);
  }

  return { subject, html, text };
};

export const verifyMailTransport = async () => {
  await getTransporter().verify();

  return {
    type: "success",
    message: "SMTP connection verified",
  };
};

export const sendRawMail = async (mailOptions) => {
  try {
    const result = await getTransporter().sendMail({
      from: getFromAddress(),
      ...mailOptions,
    });

    if (result.rejected?.length) {
      throw new Error(`Mail rejected for: ${result.rejected.join(", ")}`);
    }

    return {
      type: "success",
      message: "Mail successfully sent",
      messageId: result.messageId,
      accepted: result.accepted,
    };
  } catch (error) {
    throw error;
  }
};

export const sendMail = async (
  templateName,
  mailVariables,
  email
) => {
  const template = await getMailTemplate(templateName);
  const renderedMail = renderTemplate(template, mailVariables);

  return sendRawMail({
    to: email,
    ...renderedMail,
  });
};
