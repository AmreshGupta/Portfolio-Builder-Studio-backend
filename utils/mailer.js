// import nodemailer from "nodemailer";
// import mailTemplates from "../models/mailTemplate.js";

// let transporter = null;
// let transporterConfigKey = "";
// const templateCache = new Map();
// const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000;

// const getSmtpConfig = () => {
//   const smtpEmail = process.env.SMTP_EMAIL?.trim();
//   const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s/g, "");
//   const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
//   const smtpPort = Number(process.env.SMTP_PORT || 465);
//   const smtpSecure = String(process.env.SMTP_SECURE ?? "true").toLowerCase() !== "false";

//   if (!smtpEmail || !smtpPassword) {
//     throw new Error("SMTP_EMAIL and SMTP_PASSWORD are required");
//   }

//   if (!Number.isInteger(smtpPort)) {
//     throw new Error("SMTP_PORT must be a valid number");
//   }

//   return { smtpEmail, smtpPassword, smtpHost, smtpPort, smtpSecure };
// };

// const getTransporter = () => {
//   const { smtpEmail, smtpPassword, smtpHost, smtpPort, smtpSecure } = getSmtpConfig();
//   const configKey = `${smtpEmail}:${smtpPassword}:${smtpHost}:${smtpPort}:${smtpSecure}`;

//   if (transporter && transporterConfigKey === configKey) {
//     return transporter;
//   }

//   transporter = nodemailer.createTransport({
//     host: smtpHost,
//     port: smtpPort,
//     secure: smtpSecure,
//     pool: true,
//     maxConnections: 3,
//     maxMessages: 100,
//     connectionTimeout: 60000,
//     greetingTimeout: 60000,
//     socketTimeout: 120000,
//     auth: {
//       user: smtpEmail,
//       pass: smtpPassword,
//     },
//   });
//   transporterConfigKey = configKey;

//   return transporter;
// };

// const getFromAddress = () => {
//   const { smtpEmail } = getSmtpConfig();
//   const fromName = process.env.SMTP_FROM_NAME?.trim() || "Portfolio Builder Studio";

//   return `${fromName} <${smtpEmail}>`;
// };

// const getMailTemplate = async (templateName) => {
//   const cached = templateCache.get(templateName);

//   if (cached && cached.expiresAt > Date.now()) {
//     return cached.template;
//   }

//   const template = await mailTemplates
//     .findOne({
//       templateEvent: templateName,
//       isDeleted: false,
//       active: true,
//     })
//     .lean();

//   if (!template) {
//     throw new Error(`Mail template not found: ${templateName}`);
//   }

//   templateCache.set(templateName, {
//     template,
//     expiresAt: Date.now() + TEMPLATE_CACHE_TTL_MS,
//   });

//   return template;
// };

// const renderTemplate = (template, mailVariables = {}) => {
//   let subject = template.subject || "";
//   let html = template.htmlBody || "";
//   let text = template.textBody || "";

//   for (const key in mailVariables) {
//     const value = mailVariables[key] ?? "";
//     subject = subject.replaceAll(key, value);
//     html = html.replaceAll(key, value);
//     text = text.replaceAll(key, value);
//   }

//   return { subject, html, text };
// };

// export const verifyMailTransport = async () => {
//   await getTransporter().verify();

//   return {
//     type: "success",
//     message: "SMTP connection verified",
//   };
// };

// export const sendRawMail = async (mailOptions) => {
//   try {
//     const result = await getTransporter().sendMail({
//       from: getFromAddress(),
//       ...mailOptions,
//     });

//     if (result.rejected?.length) {
//       throw new Error(`Mail rejected for: ${result.rejected.join(", ")}`);
//     }

//     return {
//       type: "success",
//       message: "Mail successfully sent",
//       messageId: result.messageId,
//       accepted: result.accepted,
//     };
//   } catch (error) {
//     throw error;
//   }
// };

// export const sendMail = async (
//   templateName,
//   mailVariables,
//   email
// ) => {
//   const template = await getMailTemplate(templateName);
//   const renderedMail = renderTemplate(template, mailVariables);

//   return sendRawMail({
//     to: email,
//     ...renderedMail,
//   });
// };

import nodemailer from "nodemailer";
import mailTemplates from "../models/mailTemplate.js";

let transporter = null;
let transporterConfigKey = "";

const templateCache = new Map();
const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000;

// ======================
// SMTP CONFIG
// ======================

const getSmtpConfig = () => {
  const smtpEmail = process.env.SMTP_EMAIL?.trim();
  const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s/g, "");

  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";

  const smtpPort = Number(process.env.SMTP_PORT || 465);

  const smtpSecure =
    String(process.env.SMTP_SECURE ?? "true").toLowerCase() !== "false";

  if (!smtpEmail || !smtpPassword) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD are required");
  }

  if (Number.isNaN(smtpPort)) {
    throw new Error("SMTP_PORT must be a valid number");
  }

  return {
    smtpEmail,
    smtpPassword,
    smtpHost,
    smtpPort,
    smtpSecure,
  };
};

// ======================
// TRANSPORTER
// ======================

const getTransporter = () => {
  const {
    smtpEmail,
    smtpPassword,
    smtpHost,
    smtpPort,
    smtpSecure,
  } = getSmtpConfig();

  const configKey = `${smtpEmail}:${smtpPassword}:${smtpHost}:${smtpPort}:${smtpSecure}`;

  if (transporter && transporterConfigKey === configKey) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,

    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },

    // FAST & STABLE
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  transporterConfigKey = configKey;

  return transporter;
};

// ======================
// FROM ADDRESS
// ======================

const getFromAddress = () => {
  const { smtpEmail } = getSmtpConfig();

  const fromName =
    process.env.SMTP_FROM_NAME?.trim() || "Portfolio Builder Studio";

  return `${fromName} <${smtpEmail}>`;
};

// ======================
// VERIFY SMTP
// ======================

export const verifyMailTransport = async () => {
  try {
    await getTransporter().verify();

    console.log(" SMTP Connected Successfully");

    return {
      success: true,
      message: "SMTP connection verified",
    };
  } catch (error) {
    console.error(" SMTP Verify Failed:", error.message);

    throw new Error(`SMTP verification failed: ${error.message}`);
  }
};

// ======================
// TEMPLATE CACHE
// ======================

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

// ======================
// TEMPLATE RENDER
// ======================

const renderTemplate = (template, mailVariables = {}) => {
  let subject = template.subject || "";
  let html = template.htmlBody || "";
  let text = template.textBody || "";

  for (const key in mailVariables) {
    const value = String(mailVariables[key] ?? "");

    subject = subject.replaceAll(key, value).replaceAll(`{{${key}}}`, value);
    html = html.replaceAll(key, value).replaceAll(`{{${key}}}`, value);
    text = text.replaceAll(key, value).replaceAll(`{{${key}}}`, value);
  }

  if (!html) {
    html = text;
  }

  return {
    subject,
    html,
    text,
  };
};

// ======================
// RAW MAIL SEND
// ======================

export const sendRawMail = async (mailOptions) => {
  try {
    const result = await getTransporter().sendMail({
      from: getFromAddress(),
      ...mailOptions,
    });

    if (result.rejected?.length) {
      throw new Error(
        `Mail rejected for: ${result.rejected.join(", ")}`
      );
    }

    console.log(" Mail Sent:", result.messageId);

    return {
      success: true,
      message: "Mail sent successfully",
      messageId: result.messageId,
      accepted: result.accepted,
    };
  } catch (error) {
    console.error(" Mail Send Failed:", error.message);

    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// ======================
// TEMPLATE MAIL SEND
// ======================

export const sendMail = async (
  templateName,
  mailVariables,
  email
) => {
  try {
    const template = await getMailTemplate(templateName);

    const renderedMail = renderTemplate(
      template,
      mailVariables
    );

    return await sendRawMail({
      to: email,
      ...renderedMail,
    });
  } catch (error) {
    console.error(" Template Mail Failed:", error.message);

    throw error;
  }
};
