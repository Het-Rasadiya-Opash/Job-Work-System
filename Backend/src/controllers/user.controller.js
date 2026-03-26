import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw new ApiError(400, "Username, email and password are required");
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new ApiError(
        409,
        "User with this email or username already exists",
      );
    }

    const user = await User.create({ username, email, password });

    const token = user.generateToken();

    res
      .status(201)
      .cookie("token", token)
      .json(
        new ApiResponse(
          201,
          { _id: user._id, username: user.username, email: user.email },
          "Account created successfully",
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message, success: false });
    }
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "No account found with this email");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Incorrect password");
    }

    const token = user.generateToken();

    res
      .status(200)
      .cookie("token", token)
      .json(
        new ApiResponse(
          200,
          { _id: user._id, username: user.username, email: user.email },
          "Signed in successfully",
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message, success: false });
    }
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

export const logout = async (req, res) => {
  res
    .status(200)
    .clearCookie("token")
    .json(new ApiResponse(200, null, "Logged out successfully"));
};


