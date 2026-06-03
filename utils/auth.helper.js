import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendMail } from "./mailer.js";

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    },
  );
};

export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  return { resetToken, hashedToken };
};

export const hashResetToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export const normalizeOTP = (otp) => {
  return String(otp || "").replace(/\D/g, "");
};

export const hashOTP = (otp) => {
  return crypto
    .createHash("sha256")
    .update(normalizeOTP(otp))
    .digest("hex");
};

export const verifyOTPAndPassword = async (otp, hashedOTP) => {
  const otpString = normalizeOTP(otp);
  const hashedEnteredOtp = crypto
    .createHash("sha256")
    .update(otpString)
    .digest("hex");

  return hashedEnteredOtp === hashedOTP;
};

export const sendOptionalMail = async (templateName, variables, email) => {
  try {
    await sendMail(templateName, variables, email);
  } catch (error) {
    console.error(`Failed to send ${templateName} email:`, error.message);
  }
};

export const sendWelcomeMail = async ({ name, email }) => {
  return sendOptionalMail(
    "welcome-user",
    {
      "%name%": name,
      "%websiteLink%": process.env.FRONTEND_URL,
    },
    email
  );
};

export const sendOtpMail = async ({ name, otp, email }) => {
  return sendMail(
    "email-otp",
    {
      "%name%": name || "User",
      "%otp%": otp,
    },
    email
  );
};

export const sendPasswordResetMail = async ({ name, resetToken, email }) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  return sendMail(
    "forgot-password",
    {
      "%name%": name,
      "%resetLink%": resetUrl,
    },
    email
  );
};
