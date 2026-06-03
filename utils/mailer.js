import nodemailer from "nodemailer";
import mailTemplates from "../models/mailTemplate.js";

let transporter = null;
let transporterConfigKey = "";
const templateCache = new Map();
const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK_TEMPLATES = {
  "email-otp": {
    subject: "Verify Your Email - Portfolio Builder Studio",
    htmlBody: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify your email</h2>
        <p>Hello %name%,</p>
        <p>Your OTP for Portfolio Builder Studio is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">%otp%</p>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `,
    textBody: "Hello %name%, your OTP for Portfolio Builder Studio is %otp%. This OTP is valid for 5 minutes.",
  },
  "forgot-password": {
    subject: "Reset Your Password - Portfolio Builder Studio",
    htmlBody: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset your password</h2>
        <p>Hello %name%,</p>
        <p>Use this link to reset your password:</p>
        <p><a href="%resetLink%">Reset Password</a></p>
      </div>
    `,
    textBody: "Hello %name%, use this link to reset your password: %resetLink%",
  },
  "welcome-user": {
    subject: "Welcome to Portfolio Builder Studio",
    htmlBody: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome, %name%</h2>
        <p>Your Portfolio Builder Studio account is ready.</p>
        <p><a href="%websiteLink%">Open Portfolio Builder Studio</a></p>
      </div>
    `,
    textBody: "Welcome, %name%. Your Portfolio Builder Studio account is ready: %websiteLink%",
  },
};

const getSmtpConfig = () => {
  const smtpEmail = process.env.SMTP_EMAIL?.trim();
  const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s/g, "");
  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = String(process.env.SMTP_SECURE ?? "true").toLowerCase() !== "false";

  if (!smtpEmail || !smtpPassword) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD are required");
  }

  if (!Number.isInteger(smtpPort)) {
    throw new Error("SMTP_PORT must be a valid number");
  }

  return { smtpEmail, smtpPassword, smtpHost, smtpPort, smtpSecure };
};

const getTransporter = () => {
  const { smtpEmail, smtpPassword, smtpHost, smtpPort, smtpSecure } = getSmtpConfig();
  const configKey = `${smtpEmail}:${smtpPassword}:${smtpHost}:${smtpPort}:${smtpSecure}`;

  if (transporter && transporterConfigKey === configKey) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
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
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "Portfolio Builder Studio";

  return `${fromName} <${smtpEmail}>`;
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
    const fallbackTemplate = FALLBACK_TEMPLATES[templateName];

    if (!fallbackTemplate) {
      throw new Error(`Mail template not found: ${templateName}`);
    }

    return fallbackTemplate;
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
