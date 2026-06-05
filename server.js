import app from "./app.js";
import connectDB from "./config/db.js";
import path from "path";
import express from "express";

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import { verifyMailTransport } from "./utils/mailer.js";

verifyMailTransport()
  .then(() => {
    console.log("Mail Service Ready");
  })
  .catch((err) => {
    console.error(err.message);
  });
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
