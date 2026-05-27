import User from "../models/user.model.js";

import {
  hashPassword,
  comparePassword,
  generateToken
} from "../utils/auth.helper.js";

import {
  signupValidation,
  loginValidation
} from "../validations/auth.validation.js";

export const signup = async (req, res, next) => {
  try {

    const { error } = signupValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword
    });

    // const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Signup successful",
    });

  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {

    const { error } = loginValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
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

      const Password = await User.findById(user._id)
      .select("-password");

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: Password
      
    });

  } catch (error) {
    next(error);
  }
};
