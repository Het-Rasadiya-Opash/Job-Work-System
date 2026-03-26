import mongoose from "mongoose";
import Company from "../models/company.model.js";
import Vepari from "../models/vepari.model.js";
import Broker from "../models/broker.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createCompany = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized - Please sign in");
    }

    const { firm_name, gstin, address, city, state, pincode, phone, logo_url, isDefault } =
      req.body;

    if (!firm_name || !address) {
      throw new ApiError(400, "Firm name and address are required fields");
    }

    const orConditions = [{ firm_name }];
    if (gstin) orConditions.push({ gstin });
    const existing = await Company.findOne({ $or: orConditions });
    if (existing) {
      throw new ApiError(409, "Company with this firm name" + (gstin ? " or GSTIN" : "") + " already exists");
    }

    if (isDefault) {
      await Company.updateMany({ userId }, { isDefault: false });
    }

    const company = await Company.create({
      firm_name, gstin, address, city, state, pincode, phone, logo_url, isDefault: isDefault || false, userId,
    });

    res.status(201).json(new ApiResponse(201, company, "Company created successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages, success: false });
    }
    res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const getUserCompanies = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized - Please sign in");
    }
    const companies = await Company.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: "jobcards",
          localField: "_id",
          foreignField: "company_id",
          as: "jobStats",
        },
      },
      {
        $addFields: {
          total_inward: { $sum: "$jobStats.inward_pieces" },
          total_outward: { $sum: "$jobStats.outward_pieces" },
        },
      },
      { $project: { jobStats: 0 } },
    ]);
    res.status(200).json(new ApiResponse(200, companies, "Companies fetched successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const editCompany = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized - Please sign in");

    const { id } = req.params;
    const { firm_name, gstin, address, city, state, pincode, phone, logo_url, isDefault, is_active } = req.body;

    const company = await Company.findOne({ _id: id, userId });
    if (!company) throw new ApiError(404, "Company not found or access denied");

    if (firm_name || gstin) {
      const duplicate = await Company.findOne({
        _id: { $ne: id },
        $or: [
          ...(firm_name ? [{ firm_name }] : []),
          ...(gstin ? [{ gstin }] : []),
        ],
      });
      if (duplicate) throw new ApiError(409, "Company with this firm name or GSTIN already exists");
    }

    if (isDefault === true) {
      await Company.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
    }

    const updated = await Company.findByIdAndUpdate(
      id,
      { firm_name, gstin, address, city, state, pincode, phone, logo_url, ...(isDefault !== undefined && { isDefault }), ...(is_active !== undefined && { is_active }) },
      { returnDocument: "after", runValidators: true }
    );

    res.status(200).json(new ApiResponse(200, updated, "Company updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages, success: false });
    }
    res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const userId = req.user?._id;
    const company = await Company.findOne({ _id: req.params.id, userId });
    if (!company) throw new ApiError(404, "Company not found or access denied");
    res.status(200).json(new ApiResponse(200, company));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized - Please sign in");

    const { id } = req.params;

    const company = await Company.findOne({ _id: id, userId });
    if (!company) throw new ApiError(404, "Company not found or access denied");

    await Promise.all([
      Vepari.deleteMany({ company_id: id }),
      Broker.deleteMany({ company_id: id }),
    ]);
    await Company.findByIdAndDelete(id);

    res.status(200).json(new ApiResponse(200, null, "Company deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};