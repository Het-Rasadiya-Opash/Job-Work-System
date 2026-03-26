import Design from "../models/design.model.js";
import DesignPart from "../models/designPart.model.js";
import Company from "../models/company.model.js";
import Vepari from "../models/vepari.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const verifyCompany = async (userId, companyId) => {
  if (!companyId) throw new ApiError(400, "company_id is required");
  const company = await Company.findOne({ _id: companyId, userId });
  if (!company) throw new ApiError(403, "Company not found or access denied");
  return company._id;
};

export const createDesign = async (req, res) => {
  try {
    const { company_id, vepari_id, design_number, description, stitch_count, rate_per_1000, parts, image_url } = req.body;

    if (!design_number || !vepari_id) {
      throw new ApiError(400, "design_number and vepari_id are required fields");
    }
    
    const hasBaseValues = stitch_count !== undefined && rate_per_1000 !== undefined;
    const hasParts = parts && parts.length > 0;
    
    if (!hasBaseValues && !hasParts) {
      throw new ApiError(400, "Either select parts or provide stitch_count and rate_per_1000");
    }

    const companyId = await verifyCompany(req.user._id, company_id);

    const vepari = await Vepari.findOne({ _id: vepari_id, company_id: companyId });
    if (!vepari) throw new ApiError(404, "Vepari not found or doesn't belong to this company");

    const design = await Design.create({
      company_id: companyId,
      vepari_id,
      design_number: design_number.toUpperCase(),
      description,
      stitch_count,
      rate_per_1000,
      parts: parts || [],
      image_url
    });

    return res.status(201).json(new ApiResponse(201, design, "Design created successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "A design with this number already exists for this party", success: false });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const listDesign = async (req, res) => {
  try {
    const { company_id, vepari_id, page = 1, limit = 20, search } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const query = { company_id: companyId };
    if (vepari_id) query.vepari_id = vepari_id;
    if (search) query.$or = [
      { design_number: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];

    const designs = await Design.find(query)
      .populate("vepari_id", "name company_name")
      .sort({ created_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json(new ApiResponse(200, designs, "Designs retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const editDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, vepari_id, design_number, description, stitch_count, rate_per_1000, parts, image_url, is_active } = req.body;

    const companyId = await verifyCompany(req.user._id, company_id);

    const design = await Design.findOne({ _id: id, company_id: companyId });
    if (!design) throw new ApiError(404, "Design not found or access denied");

    // If vepari is being updated, check if it belongs to the company
    if (vepari_id && vepari_id !== String(design.vepari_id)) {
      const vepari = await Vepari.findOne({ _id: vepari_id, company_id: companyId });
      if (!vepari) throw new ApiError(404, "Vepari not found or doesn't belong to this company");
    }

    if (design_number && (design_number.toUpperCase() !== design.design_number || (vepari_id && vepari_id !== String(design.vepari_id)))) {
      const checkVepariId = vepari_id || design.vepari_id;
      const duplicate = await Design.findOne({ 
        _id: { $ne: id }, 
        company_id: companyId, 
        vepari_id: checkVepariId,
        design_number: design_number.toUpperCase() 
      });
      if (duplicate) throw new ApiError(409, "A design with this number already exists for this party");
    }

    const updated = await Design.findByIdAndUpdate(
      id,
      {
        ...(vepari_id && { vepari_id }),
        ...(design_number && { design_number: design_number.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(stitch_count !== undefined && { stitch_count: Number(stitch_count) }),
        ...(rate_per_1000 !== undefined && { rate_per_1000: Number(rate_per_1000) }),
        ...(parts !== undefined && { parts }),
        ...(image_url !== undefined && { image_url }),
        ...(is_active !== undefined && { is_active }),
      },
      { returnDocument: "after", runValidators: true }
    ).populate("vepari_id", "name company_name");

    return res.status(200).json(new ApiResponse(200, updated, "Design updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "A design with this number already exists for this party", success: false });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: messages, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const deleteDesign = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const design = await Design.findOne({ _id: id, company_id: companyId });
    if (!design) throw new ApiError(404, "Design not found or access denied");

    await Design.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, null, "Design deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const createDesignPart = async (req, res) => {
  try {
    const { company_id, part_name } = req.body;
    if (!part_name) throw new ApiError(400, "part_name is required");

    const companyId = await verifyCompany(req.user._id, company_id);

    const existing = await DesignPart.findOne({
      company_id: companyId,
      part_name: { $regex: new RegExp(`^${part_name}$`, "i") }
    });
    if (existing) throw new ApiError(409, "Part name already exists");

    const part = await DesignPart.create({ company_id: companyId, part_name });
    return res.status(201).json(new ApiResponse(201, part, "Design part created successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const listDesignParts = async (req, res) => {
  try {
    const { company_id } = req.query;
    const companyId = await verifyCompany(req.user._id, company_id);
    const parts = await DesignPart.find({ company_id: companyId }).sort({ created_at: 1 });
    return res.status(200).json(new ApiResponse(200, parts, "Fetched successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
