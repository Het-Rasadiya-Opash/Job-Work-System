import Machine from "../models/machine.model.js";
import Company from "../models/company.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const verifyCompany = async (userId, companyId) => {
  if (!companyId) throw new ApiError(400, "company_id is required");
  const company = await Company.findOne({ _id: companyId, userId });
  if (!company) throw new ApiError(403, "Company not found or access denied");
  return company._id;
};

export const createMachine = async (req, res) => {
  try {
    const { name, company_id } = req.body;
    if (!name) throw new ApiError(400, "Machine name is required");

    const companyId = await verifyCompany(req.user._id, company_id);

    const machine = await Machine.create({
      company_id: companyId,
      name,
    });

    return res.status(201).json(new ApiResponse(201, machine, "Machine created successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const listMachines = async (req, res) => {
  try {
    const { company_id } = req.query;
    const companyId = await verifyCompany(req.user._id, company_id);

    const machines = await Machine.find({ company_id: companyId }).sort({ created_at: -1 });

    return res.status(200).json(new ApiResponse(200, machines));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const editMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active, company_id } = req.body;

    const companyId = await verifyCompany(req.user._id, company_id);

    const machine = await Machine.findOne({ _id: id, company_id: companyId });
    if (!machine) throw new ApiError(404, "Machine not found or access denied");

    const updated = await Machine.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(is_active !== undefined && { is_active }),
      },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, "Machine updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const deleteMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const machine = await Machine.findOne({ _id: id, company_id: companyId });
    if (!machine) throw new ApiError(404, "Machine not found or access denied");

    await Machine.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, null, "Machine deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
