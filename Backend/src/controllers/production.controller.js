import Production from "../models/production.model.js";
import Company from "../models/company.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const verifyCompany = async (userId, companyId) => {
  if (!companyId) throw new ApiError(400, "company_id is required");
  const company = await Company.findOne({ _id: companyId, userId });
  if (!company) throw new ApiError(403, "Company not found or access denied");
  return company._id;
};

export const createProduction = async (req, res) => {
  try {
    const { machine_id, employee_id, design_id, date, shift, produced_quantity, company_id } = req.body;
    
    if (!machine_id || !employee_id || !design_id || !date || !produced_quantity) {
      throw new ApiError(400, "All fields are required");
    }

    const companyId = await verifyCompany(req.user._id, company_id);

    const production = await Production.create({
      company_id: companyId,
      machine_id,
      employee_id,
      design_id,
      date,
      shift: shift || "Day",
      produced_quantity,
    });

    const populatedProduction = await Production.findById(production._id)
      .populate("machine_id", "name")
      .populate("employee_id", "name phone")
      .populate("design_id", "design_no");

    return res.status(201).json(new ApiResponse(201, populatedProduction, "Production entry created successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const listProductions = async (req, res) => {
  try {
    const { company_id, machine_id, employee_id, startDate, endDate } = req.query;
    const companyId = await verifyCompany(req.user._id, company_id);

    const query = { company_id: companyId };
    
    if (machine_id) query.machine_id = machine_id;
    if (employee_id) query.employee_id = employee_id;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const productions = await Production.find(query)
      .populate("machine_id", "name")
      .populate("employee_id", "name phone")
      .populate("design_id", "design_no")
      .sort({ date: -1, created_at: -1 });

    return res.status(200).json(new ApiResponse(200, productions));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const editProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { machine_id, employee_id, design_id, date, shift, produced_quantity, company_id } = req.body;

    const companyId = await verifyCompany(req.user._id, company_id);

    const production = await Production.findOne({ _id: id, company_id: companyId });
    if (!production) throw new ApiError(404, "Production entry not found or access denied");

    const updated = await Production.findByIdAndUpdate(
      id,
      {
        ...(machine_id && { machine_id }),
        ...(employee_id && { employee_id }),
        ...(design_id && { design_id }),
        ...(date && { date }),
        ...(shift && { shift }),
        ...(produced_quantity !== undefined && { produced_quantity }),
      },
      { returnDocument: "after", runValidators: true }
    )
    .populate("machine_id", "name")
    .populate("employee_id", "name phone")
    .populate("design_id", "design_no");

    return res.status(200).json(new ApiResponse(200, updated, "Production entry updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const deleteProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.query;

    const companyId = await verifyCompany(req.user._id, company_id);

    const production = await Production.findOne({ _id: id, company_id: companyId });
    if (!production) throw new ApiError(404, "Production entry not found or access denied");

    await Production.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, null, "Production entry deleted successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
