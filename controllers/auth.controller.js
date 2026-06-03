import User from "../models/user.model.js";
import { sendMail } from "../utils/mailer.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import {
  hashPassword,
  comparePassword,
  generateToken,
  generateOTP,
  hashOTP,
  verifyOTPAndPassword,
  sendOptionalMail
} from "../utils/auth.helper.js";

import {
  signupValidation,
  loginValidation
} from "../validations/auth.validation.js";

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function toAuthUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    token: user.token,
  };
}

export const signup = async (req, res, next) => {
  try {
    const { error, value } = signupValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { fullName, name, password } = value;
    const email = normalizeEmail(value.email);
    const displayName = fullName || name;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    if (user.password) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    user.fullName = displayName;
    user.password = hashedPassword;
    user.token = generateToken(user._id);

    await user.save();

    sendOptionalMail(
      "welcome-user",
      {
        "%name%": displayName,
        "%websiteLink%": process.env.FRONTEND_URL,
      },
      email
    );

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: toAuthUser(user),
    });

  } catch (error) {
    next(error);
  }
};

export const sendEmailOtp = async (req, res, next) => {
  try {
    const { fullName, name } = req.body;
    const email = normalizeEmail(req.body.email);
    const displayName = fullName || name;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    let user = await User.findOne({ email });

    if (user?.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "This email is already Registered. Please login.",
      });
    }

    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    if (!user) {
      user = await User.create({
        fullName: displayName,
        email,
        emailOtp: hashedOtp,
        emailOtpExpiry: expiry,
      });
    } else {
      user.fullName = displayName;
      user.emailOtp = hashedOtp;
      user.emailOtpExpiry = expiry;

      await user.save();
    }

    try {
      await sendMail(
        "email-otp",
        {
          "%name%": displayName || "User",
          "%otp%": otp,
        },
        email
      );
    } catch (error) {
      console.error("Failed to send OTP email:", error.message);

      return res.status(502).json({
        success: false,
        message: "Unable to send OTP email. Please check SMTP configuration.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP is being sent successfully",
    });

  } catch (error) {
    next(error);
  }
};

export const verifyEmailOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.emailOtp || !user.emailOtpExpiry || new Date() > user.emailOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const isOtpValid = await verifyOTPAndPassword(
      otp,
      user.emailOtp
    );

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.emailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiry = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { error, value } = loginValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const email = normalizeEmail(value.email);
    const { password } = value;

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user._id);
    user.token = token;

    await user.save();

    const authUser = await User.findById(user._id)
      .select("-password");

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        ...authUser.toObject(),
        name: authUser.fullName,
      }
    });

  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendMail(
        "forgot-password",
        {
          "%name%": user.fullName,
          "%resetLink%": resetUrl,
        },
        user.email
      );
    } catch (error) {
      console.error("Failed to send password reset email:", error.message);

      return res.status(502).json({
        success: false,
        message: "Unable to send password reset email. Please check SMTP configuration.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to email",
    });

  } catch (error) {
    next(error);
  }
};


export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.token = null;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error) {
    next(error);
  }
};
