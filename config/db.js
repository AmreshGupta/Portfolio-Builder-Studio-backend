import mongoose from "mongoose";
import MailTemplates from "../models/mailTemplate.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const connectDB = async () => {
  try {
    if (!process.env.CONNECTION_STRING) {
      throw new Error("CONNECTION_STRING is missing");
    }

    const connect = await mongoose.connect(process.env.CONNECTION_STRING);
    console.log(
      `Database connected successfully:\nHost: ${connect.connection.host}\nName: ${connect.connection.name}`,
    );
    0;
    const [user, template] = await Promise.all([
      User.countDocuments({}),
      MailTemplates.countDocuments({}),
    ]);
    const seedEmail = process.env.SEED_ADMIN_EMAIL || "kumargupta5424@gmail.com";
    const seedPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
    const shouldSeedUser =
      user === 0 &&
      (process.env.NODE_ENV !== "production" ||
        (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD));

    if (shouldSeedUser) {
      const hashedPassword = await bcrypt.hash(seedPassword, 10);
      await User.create({
        fullName: "Amresh Gupta",
        email: seedEmail,
        password: hashedPassword,
      });
    }

    if (!template) {
      await MailTemplates.insertMany([
        {
          templateEvent: "welcome-user",
          subject: "Welcome to Portfolio Builder Studio ",
          mailVariables: "%name%",
          htmlBody: `<!DOCTYPE html>
   <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome Email</title>
    </head>

    <body
      style="
        margin: 0;
        padding: 0;
        background: #070b1a;
        font-family: Arial, sans-serif;
      "
    >
      <div
        style="
          width: 100%;
          padding: 40px 15px;
          box-sizing: border-box;
        "
      >
        <div
          style="
            max-width: 620px;
            margin: auto;
            background: linear-gradient(180deg, #111827 0%, #0b1020 100%);
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid rgba(139, 92, 246, 0.25);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          "
        >
          
          <!-- Header -->
          <div
            style="
              padding: 45px 40px 25px;
              text-align: center;
              background: linear-gradient(135deg, #7c3aed, #8b5cf6);
            "
          >
            <div
              style="
                width: 70px;
                height: 70px;
                line-height: 70px;
                margin: auto;
                border-radius: 18px;
                background: rgba(255,255,255,0.15);
                font-size: 34px;
                color: white;
                font-weight: bold;
              "
            >
              P
            </div>

            <h1
              style="
                color: white;
                margin-top: 22px;
                margin-bottom: 10px;
                font-size: 34px;
                font-weight: 700;
              "
            >
              Welcome to Portfolio Builder Studio
            </h1>

            <p
              style="
                color: rgba(255,255,255,0.85);
                font-size: 16px;
                line-height: 1.8;
                margin: 0;
              "
            >
              Your creative workspace is ready.
              Start building your professional portfolio now.
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 40px">
            <p
              style="
                color: #d1d5db;
                font-size: 17px;
                line-height: 1.8;
                margin-top: 0;
              "
            >
              Hey <strong style="color:#ffffff">%name%</strong>,
            </p>

            <p
              style="
                color: #9ca3af;
                font-size: 16px;
                line-height: 1.9;
              "
            >
              Thank you for signing up for
              <span style="color:#a78bfa;font-weight:600;">
                Portfolio Builder Studio
              </span>.
              Your account has been successfully created and your workspace is now active.
            </p>

            <!-- Feature Box -->
            <div
              style="
                margin: 35px 0;
                background: rgba(124, 58, 237, 0.08);
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 18px;
                padding: 28px;
              "
            >
              <h3
                style="
                  margin-top: 0;
                  color: #ffffff;
                  font-size: 20px;
                  margin-bottom: 18px;
                "
              >
                What you can do now 
              </h3>

              <p style="color:#cbd5e1;font-size:15px;line-height:1.8;margin:0;">
                • Create stunning developer portfolios <br />
                • Customize themes & layouts <br />
                • Save and edit projects anytime <br />
                • Publish your portfolio instantly
              </p>
            </div>

            <!-- Button -->
            <div style="text-align:center;margin-top:40px;">
              <a
                href="%websiteLink%"
                style="
                  display: inline-block;
                  background: linear-gradient(90deg, #7c3aed, #8b5cf6);
                  color: white;
                  text-decoration: none;
                  padding: 16px 34px;
                  border-radius: 12px;
                  font-size: 16px;
                  font-weight: bold;
                  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
                "
              >
                Open Your Studio
              </a>
            </div>

            <p
              style="
                color: #6b7280;
                font-size: 14px;
                line-height: 1.8;
                margin-top: 45px;
                text-align:center;
              "
            >
              If you did not create this account, you can safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div
            style="
              border-top: 1px solid rgba(255,255,255,0.06);
              padding: 25px;
              text-align: center;
              background: #0a0f1d;
            "
          >
            <p
              style="
                margin: 0;
                color: #6b7280;
                font-size: 13px;
              "
            >
              © 2026 Portfolio Builder Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
   </html>`,

          textBody:
            "Welcome to Portfolio Builder Studio, %name%! Your account has been successfully created.",
        },

        {
          templateEvent: "email-otp",
          subject: "Verify Your Email - Portfolio Builder Studio",
          mailVariables: "%otp%",
          htmlBody: `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verify OTP</title>
    </head>
    
    <body style="margin:0;padding:0;background:#070b1a;font-family:Arial,sans-serif;">
    
      <div style="width:100%;padding:40px 15px;box-sizing:border-box;">
    
        <div
          style="
            max-width:620px;
            margin:auto;
            background:linear-gradient(180deg,#111827 0%,#0b1020 100%);
            border-radius:24px;
            overflow:hidden;
            border:1px solid rgba(139,92,246,0.25);
            box-shadow:0 10px 40px rgba(0,0,0,0.4);
          "
        >
    
          <!-- Header -->
          <div
            style="
              padding:45px 40px 25px;
              text-align:center;
              background:linear-gradient(135deg,#7c3aed,#8b5cf6);
            "
          >
    
            <div
              style="
                width:70px;
                height:70px;
                line-height:70px;
                margin:auto;
                border-radius:18px;
                background:rgba(255,255,255,0.15);
                font-size:34px;
                color:white;
                font-weight:bold;
              "
            >
              P
            </div>
    
            <h1
          style="
            color:white;
            margin-top:22px;
            margin-bottom:10px;
            font-size:34px;
            font-weight:700;
          "
        >
          Verify Your Email
        </h1>

        <p
          style="
            color:rgba(255,255,255,0.85);
            font-size:16px;
            line-height:1.8;
            margin:0;
          "
        >
          Complete your account verification using the OTP below.
        </p>

      </div>

      <!-- Body -->
      <div style="padding:40px;">

        <p
          style="
            color:#d1d5db;
            font-size:17px;
            line-height:1.8;
            margin-top:0;
          "
        >
          <strong style="color:#ffffff;">Dear User</strong>,
        </p>

        <p
          style="
            color:#9ca3af;
            font-size:16px;
            line-height:1.9;
          "
        >
          Thank you for signing up for
          <span style="color:#a78bfa;font-weight:600;">
            Portfolio Builder Studio
          </span>.
          Please use the verification code below to activate your account.
        </p>

        <!-- OTP BOX -->
        <div style="margin:40px 0;text-align:center;">

          <div
            style="
              display:inline-block;
              background:rgba(124,58,237,0.12);
              border:1px solid rgba(139,92,246,0.3);
              padding:22px 40px;
              border-radius:18px;
            "
          >

            <p
              style="
                margin:0;
                color:#9ca3af;
                font-size:14px;
                letter-spacing:1px;
              "
            >
              YOUR OTP CODE
            </p>

            <h2
              style="
                margin:12px 0 0;
                color:#ffffff;
                font-size:42px;
                letter-spacing:10px;
              "
            >
              %otp%
            </h2>

          </div>

        </div>

        <!-- Info -->
        <div
          style="
            background:rgba(255,255,255,0.03);
            border-radius:16px;
            padding:24px;
            border:1px solid rgba(255,255,255,0.05);
          "
        >

          <p
            style="
              margin:0;
              color:#cbd5e1;
              font-size:15px;
              line-height:1.8;
            "
          >
            • This OTP is valid for 5 minutes <br />
            • Do not share this code with anyone <br />
            • Enter this OTP to complete your signup process
          </p>

        </div>

        <p
          style="
            color:#6b7280;
            font-size:14px;
            line-height:1.8;
            margin-top:40px;
            text-align:center;
          "
        >
          If you did not request this verification, you can safely ignore this email.
        </p>

      </div>

      <!-- Footer -->
      <div
        style="
          border-top:1px solid rgba(255,255,255,0.06);
          padding:25px;
          text-align:center;
          background:#0a0f1d;
        "
      >

        <p
          style="
            margin:0;
            color:#6b7280;
            font-size:13px;
          "
        >
          © 2026 Portfolio Builder Studio. All rights reserved.
        </p>

      </div>

    </div>

  </div>

</body>
</html>`,

          textBody:
            "Dear User, your OTP for Portfolio Builder Studio is %otp%. This OTP is valid for 5 minutes.",
        },

        {
          templateEvent: "forgot-password",
          subject: "Reset Your Password - Portfolio Builder Studio",
          mailVariables: "%name%, %resetLink%",
          htmlBody: `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Reset Password</title>
            </head>
            
            <body
              style="
                margin: 0;
                padding: 0;
                background: #070b1a;
                font-family: Arial, sans-serif;
              "
            >
          <div
            style="
              width: 100%;
              padding: 40px 15px;
              box-sizing: border-box;
            "
          >
    <div
      style="
        max-width: 620px;
        margin: auto;
        background: linear-gradient(180deg, #111827 0%, #0b1020 100%);
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid rgba(139, 92, 246, 0.25);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      "
    >

      <!-- Header -->
      <div
        style="
          padding: 45px 40px 25px;
          text-align: center;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
        "
      >
        <div
          style="
            width: 70px;
            height: 70px;
            line-height: 70px;
            margin: auto;
            border-radius: 18px;
            background: rgba(255,255,255,0.15);
            font-size: 34px;
            color: white;
            font-weight: bold;
          "
        >
          P
        </div>

        <h1
          style="
            color: white;
            margin-top: 22px;
            margin-bottom: 10px;
            font-size: 34px;
            font-weight: 700;
          "
        >
          Reset Your Password
        </h1>

        <p
          style="
            color: rgba(255,255,255,0.85);
            font-size: 16px;
            line-height: 1.8;
            margin: 0;
          "
        >
          We received a request to reset your password.
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 40px">

        <p
          style="
            color: #d1d5db;
            font-size: 17px;
            line-height: 1.8;
            margin-top: 0;
          "
        >
          Hey <strong style="color:#ffffff">%name%</strong>,
        </p>

        <p
          style="
            color: #9ca3af;
            font-size: 16px;
            line-height: 1.9;
          "
        >
          We received a request to reset your password for your
          <span style="color:#a78bfa;font-weight:600;">
            Portfolio Builder Studio
          </span>
          account.
        </p>

        <!-- Security Box -->
        <div
          style="
            margin: 35px 0;
            background: rgba(124, 58, 237, 0.08);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 18px;
            padding: 28px;
          "
        >
          <h3
            style="
              margin-top: 0;
              color: #ffffff;
              font-size: 20px;
              margin-bottom: 18px;
            "
          >
            Security Notice
          </h3>

          <p
            style="
              color:#cbd5e1;
              font-size:15px;
              line-height:1.8;
              margin:0;
            "
          >
            • This password reset link will expire in 15 minutes <br />
            • If you did not request this, ignore this email <br />
            • Your account remains secure until the password is changed
          </p>
        </div>

        <!-- Button -->
        <div style="text-align:center;margin-top:40px;">
          <a
            href="%resetLink%"
            style="
              display: inline-block;
              background: linear-gradient(90deg, #7c3aed, #8b5cf6);
              color: white;
              text-decoration: none;
              padding: 16px 34px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: bold;
              box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
            "
          >
            Reset Password
          </a>
        </div>

        <p
          style="
            color: #6b7280;
            font-size: 14px;
            line-height: 1.8;
            margin-top: 45px;
            text-align:center;
          "
        >
          If the button above doesn't work, copy and paste the link below into your browser.
        </p>

        <p
          style="
            color:#a78bfa;
            font-size:13px;
            word-break:break-all;
            text-align:center;
          "
        >
          %resetLink%
        </p>

      </div>

      <!-- Footer -->
      <div
        style="
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 25px;
          text-align: center;
          background: #0a0f1d;
        "
      >
        <p
          style="
            margin: 0;
            color: #6b7280;
            font-size: 13px;
          "
        >
          © 2026 Portfolio Builder Studio. All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`,

          textBody:
            "Hello %name%, reset your password using this link: %resetLink%",
        },
      ]);
    }
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

export default connectDB;
