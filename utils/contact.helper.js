import crypto from "crypto";
import { sendRawMail } from "./mailer.js";
import { escapeHtml } from "./html.js";

const duplicateMessages = new Map();
const DUPLICATE_WINDOW_MS = 60 * 1000;

function getMessageKey({ slug, recipientEmail, senderEmail, message }) {
  return crypto
    .createHash("sha256")
    .update(
      [
        slug?.toLowerCase(),
        recipientEmail?.toLowerCase(),
        senderEmail?.toLowerCase(),
        message,
      ].join("|"),
    )
    .digest("hex");
}

export function isDuplicateContactMessage(messageData) {
  const now = Date.now();
  const key = getMessageKey(messageData);
  const expiresAt = duplicateMessages.get(key);

  if (expiresAt && expiresAt > now) {
    return true;
  }

  duplicateMessages.set(key, now + DUPLICATE_WINDOW_MS);
  setTimeout(() => duplicateMessages.delete(key), DUPLICATE_WINDOW_MS).unref?.();

  return false;
}

export function buildPortfolioContactMail({
  ownerName,
  senderName,
  senderEmail,
  message,
}) {
  const subject = `New portfolio message from ${senderName}`;
  const text = [
    `Hi ${ownerName},`,
    "",
    "You received a new message from your portfolio contact form.",
    "",
    `Name: ${senderName}`,
    `Email: ${senderEmail}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const safeOwnerName = escapeHtml(ownerName);
  const safeSenderName = escapeHtml(senderName);
  const safeSenderEmail = escapeHtml(senderEmail);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <p>Hi ${safeOwnerName},</p>
      <p>You received a new message from your portfolio contact form.</p>
      <p><strong>Name:</strong> ${safeSenderName}</p>
      <p><strong>Email:</strong> ${safeSenderEmail}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    </div>
  `;

  return { subject, text, html };
}

export async function sendOptionalRawMail(mailOptions) {
  try {
    await sendRawMail(mailOptions);
  } catch (error) {
    console.error("Failed to send portfolio contact email:", error.message);
  }
}
