import express from "express";
import {
  createOrUpdatePortfolio,
  deletePortfolio,
  getMyPortfolios,
  getPortfolioBySlug,
  sendPortfolioMessage,
  uploadPortfolioImageFile,
  updatePortfolio,
} from "../controllers/portfolio.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { uploadPortfolioImage } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/my", authMiddleware, getMyPortfolios);
router.post("/upload-image", authMiddleware, uploadPortfolioImage.single("image"), uploadPortfolioImageFile);
router.post("/create", authMiddleware, createOrUpdatePortfolio);
router.put("/:id", authMiddleware, updatePortfolio);
router.delete("/:id", authMiddleware, deletePortfolio);
router.post("/:slug/contact", sendPortfolioMessage);
router.get("/:slug", getPortfolioBySlug);

export default router;
