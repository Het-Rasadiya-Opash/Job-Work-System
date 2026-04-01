import Employee from "../models/employee.model.js";
import Company from "../models/company.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const verifyCompany = async (userId, companyId) => {
  if (!companyId) throw new ApiError(400, "company_id is required");
  const company = await Company.findOne({ _id: companyId, userId });
  if (!company) throw new ApiError(403, "Company not found or access denied");
  return company._id;
};

export const createEmployee = async (req, res) => {
  try {
    const { name, phone, role, company_id } = req.body;
    if (!name) throw new ApiError(400, "Employee name is required");

    const companyId = await verifyCompany(req.user._id, company_id);

    const employee = await Employee.create({
      company_id: companyId,
      name,
      ...(phone && { phone }),
      ...(role && { role }),
    });

    return res.status(201).json(new ApiResponse(201, employee, "Employee created successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const listEmployees = async (req, res) => {
  try {
    const { company_id } = req.query;
    const companyId = await verifyCompany(req.user._id, company_id);

    const employees = await Employee.find({ company_id: companyId }).sort({ created_at: -1 });

    return res.status(200).json(new ApiResponse(200, employees));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const editEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, is_active, company_id } = req.body;

    const companyId = await verifyCompany(req.user._id, company_id);

    const employee = await Employee.findOne({ _id: id, company_id: companyId });
    if (!employee) throw new ApiError(404, "Employee not found or access denied");

    const updated = await Employee.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
        ...(is_active !== undefined && { is_active }),
      },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, "Employee updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const employee = await Employee.findOne({ _id: id, company_id: companyId });
    if (!employee) throw new ApiError(404, "Employee not found or access denied");

    await Employee.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, null, "Employee deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
