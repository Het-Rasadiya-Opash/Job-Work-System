import Vepari from "../models/vepari.model.js";
import Company from "../models/company.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const verifyCompany = async (userId, companyId) => {
  if (!companyId) throw new ApiError(400, "company_id is required");
  const company = await Company.findOne({ _id: companyId, userId });
  if (!company) throw new ApiError(403, "Company not found or access denied");
  return company._id;
};


export const createVepari = async (req, res) => {
  try {
    const { name, phone, company_name, gstin, address, city, state, broker_id, company_id } = req.body;

    if (!name || !phone) throw new ApiError(400, "Name and phone are required fields");

    const companyId = await verifyCompany(req.user._id, company_id);

    const vepari = await Vepari.create({
      company_id: companyId,
      name,
      phone,
      ...(company_name && { company_name }),
      ...(gstin && { gstin }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(broker_id && { broker_id }),
    });

    return res.status(201).json(new ApiResponse(201, vepari, "Vepari created successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "A vepari with this phone number already exists in your company", success: false });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};


export const listVeparis = async (req, res) => {
  try {
    const { company_id, page = 1, limit = 20, broker_id, search } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const query = { company_id: companyId };
    if (broker_id) query.broker_id = broker_id;
    if (search) query.$or = [
      { name: { $regex: search, $options: "i" } },
      { company_name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];

    const veparis = await Vepari.find(query)
      .sort({ created_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json(new ApiResponse(200, veparis));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};


export const editVepari = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, company_name, gstin, address, city, state, broker_id, is_active, company_id } = req.body;

    const companyId = await verifyCompany(req.user._id, company_id);

    const vepari = await Vepari.findOne({ _id: id, company_id: companyId });
    if (!vepari) throw new ApiError(404, "Vepari not found or access denied");

    if (phone && phone !== vepari.phone) {
      const duplicate = await Vepari.findOne({ _id: { $ne: id }, company_id: companyId, phone });
      if (duplicate) throw new ApiError(409, "A vepari with this phone number already exists in your company");
    }

    const updated = await Vepari.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(company_name !== undefined && { company_name }),
        ...(gstin !== undefined && { gstin }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(broker_id !== undefined && { broker_id }),
        ...(is_active !== undefined && { is_active }),
      },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, "Vepari updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "A vepari with this phone number already exists in your company", success: false });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};


export const deleteVepari = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const vepari = await Vepari.findOne({ _id: id, company_id: companyId });
    if (!vepari) throw new ApiError(404, "Vepari not found or access denied");

    await Vepari.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, null, "Vepari deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
