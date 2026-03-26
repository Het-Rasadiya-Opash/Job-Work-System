import Broker from "../models/broker.model.js";
import Company from "../models/company.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const verifyCompany = async (userId, companyId) => {
  if (!companyId) throw new ApiError(400, "company_id is required");
  const company = await Company.findOne({ _id: companyId, userId });
  if (!company) throw new ApiError(403, "Company not found or access denied");
  return company._id;
};


export const createBroker = async (req, res) => {
  try {
    const { name, phone, alternate_phone, commission_rate, address, company_id } = req.body;

    if (!name || !phone) throw new ApiError(400, "Name and phone are required fields");

    const companyId = await verifyCompany(req.user._id, company_id);

    const broker = await Broker.create({
      company_id: companyId,
      name,
      phone,
      commission_rate: commission_rate ?? 0,
      ...(alternate_phone && { alternate_phone }),
      ...(address && { address }),
    });

    return res.status(201).json(new ApiResponse(201, broker, "Broker created successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "A broker with this phone number already exists in your company", success: false });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};


export const listBrokers = async (req, res) => {
  try {
    const { company_id, page = 1, limit = 20, search } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const query = { company_id: companyId };
    if (search) query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];

    const brokers = await Broker.find(query)
      .sort({ created_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json(new ApiResponse(200, brokers));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};


export const editBroker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, alternate_phone, commission_rate, address, is_active, company_id } = req.body;

    const companyId = await verifyCompany(req.user._id, company_id);

    const broker = await Broker.findOne({ _id: id, company_id: companyId });
    if (!broker) throw new ApiError(404, "Broker not found or access denied");

    if (phone && phone !== broker.phone) {
      const duplicate = await Broker.findOne({ _id: { $ne: id }, company_id: companyId, phone });
      if (duplicate) throw new ApiError(409, "A broker with this phone number already exists in your company");
    }

    const updated = await Broker.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(alternate_phone !== undefined && { alternate_phone }),
        ...(commission_rate !== undefined && { commission_rate }),
        ...(address !== undefined && { address }),
        ...(is_active !== undefined && { is_active }),
      },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, "Broker updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "A broker with this phone number already exists in your company", success: false });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};


export const deleteBroker = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const broker = await Broker.findOne({ _id: id, company_id: companyId });
    if (!broker) throw new ApiError(404, "Broker not found or access denied");

    await Broker.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, null, "Broker deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
