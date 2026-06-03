import Portfolio from "../models/portfolio.model.js";
import {
  buildPortfolioContactMail,
  isDuplicateContactMessage,
  markContactMessageSent,
} from "../utils/contact.helper.js";
import { sendRawMail } from "../utils/mailer.js";
import { toClientPortfolio } from "../utils/portfolio.mapper.js";
import {
  buildPortfolioPayload,
  getFirst,
  normalizeSlug,
  validatePortfolioMessage,
  validatePortfolioPayload,
} from "../validations/portfolio.validation.js";

async function getAvailableSlug(slug, excludePortfolioId = null) {
  const baseSlug = normalizeSlug(slug);
  let nextSlug = baseSlug;
  let suffix = 2;

  while (
    await Portfolio.exists({
      slug: nextSlug,
      ...(excludePortfolioId ? { _id: { $ne: excludePortfolioId } } : {}),
    })
  ) {
    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return nextSlug;
}

export const createOrUpdatePortfolio = async (req, res, next) => {
  try {
    const payload = buildPortfolioPayload(req.body, req.user._id);
    const validationMessage = validatePortfolioPayload(payload);

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    const existingMine = await Portfolio.findOne({ userId: req.user._id });
    const query = existingMine ? { _id: existingMine._id, userId: req.user._id } : { userId: req.user._id };
    payload.slug = await getAvailableSlug(payload.slug, existingMine?._id);

    const portfolio = await Portfolio.findOneAndUpdate(query, payload, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }).lean();

    return res.status(200).json({
      success: true,
      message: "Portfolio saved successfully",
      portfolio: toClientPortfolio(portfolio),
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(409).json({
        success: false,
        message: "This portfolio URL is already taken",
      });
    }

    next(error);
  }
};

export const uploadPortfolioImageFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Image file is required",
    });
  }

  return res.status(201).json({
    success: true,
    filename: req.file.filename,
  });
};

export const getMyPortfolios = async (req, res, next) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      portfolios: portfolios.map(toClientPortfolio),
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(409).json({
        success: false,
        message: "This portfolio URL is already taken",
      });
    }

    next(error);
  }
};

export const updatePortfolio = async (req, res, next) => {
  try {
    const payload = buildPortfolioPayload(req.body, req.user._id);
    const validationMessage = validatePortfolioPayload(payload);

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    payload.slug = await getAvailableSlug(payload.slug, req.params.id);

    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      payload,
      { new: true, runValidators: true },
    ).lean();

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Portfolio updated successfully",
      portfolio: toClientPortfolio(portfolio),
    });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioBySlug = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      slug: normalizeSlug(req.params.slug),
      isPublished: true,
    })
      .populate("userId", "email fullName")
      .lean();

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    return res.status(200).json({
      success: true,
      portfolio: toClientPortfolio(portfolio),
    });
  } catch (error) {
    next(error);
  }
};

export const sendPortfolioMessage = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      slug: normalizeSlug(req.params.slug),
      isPublished: true,
    })
      .populate("userId", "email fullName")
      .lean();

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    const contact = getFirst(portfolio.contact);
    const recipientEmail = contact.email?.trim() || portfolio.userId?.email?.trim();
    const { error: messageError, value: messageData } = validatePortfolioMessage(req.body);

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: "Portfolio owner has not added a contact email",
      });
    }

    if (messageError) {
      return res.status(400).json({
        success: false,
        message: messageError,
      });
    }

    const { name: senderName, email: senderEmail, message } = messageData;

    const ownerName = getFirst(portfolio.hero).fullName || portfolio.userId?.fullName || "Portfolio owner";
    const duplicateMessageData = {
      slug: req.params.slug,
      recipientEmail,
      senderEmail,
      message,
    };
    const isDuplicate = isDuplicateContactMessage(duplicateMessageData);

    if (isDuplicate) {
      return res.status(429).json({
        success: false,
        message: "This message was already sent. Please wait before sending again.",
      });
    }

    const { subject, text, html } = buildPortfolioContactMail({
      ownerName,
      senderName,
      senderEmail,
      message,
    });

    try {
      await sendRawMail({
        to: recipientEmail,
        replyTo: senderEmail,
        subject,
        text,
        html,
      });
      markContactMessageSent(duplicateMessageData);
    } catch (error) {
      console.error("Failed to send portfolio contact email:", error.message);

      return res.status(502).json({
        success: false,
        message: "Unable to send portfolio contact email. Please check SMTP configuration.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message is being sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deletePortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Portfolio deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
