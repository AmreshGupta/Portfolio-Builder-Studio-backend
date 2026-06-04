import express from "express";

import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  sendEmailOtp,
  verifyEmailOtp,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/send-otp", sendEmailOtp);
router.post("/verify-otp", verifyEmailOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/test-mail", async (req, res) => {
  try {
    await sendRawMail({
      to: "yourtestemail@gmail.com",
      subject: "Test OTP",
      html: "<h1>Mail Working</h1>",
    });

    res.send("Mail Sent");
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

export default router;
