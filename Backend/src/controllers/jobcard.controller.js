import JobCard from "../models/jobcard.model.js";
import Design from "../models/design.model.js";
import Vepari from "../models/vepari.model.js";
import Broker from "../models/broker.model.js";
import Company from "../models/company.model.js";
import Counter from "../models/counter.model.js";
import Challan from "../models/challan.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const verifyCompany = async (userId, companyId) => {
  if (!companyId) throw new ApiError(400, "company_id is required");
  const company = await Company.findOne({ _id: companyId, userId });
  if (!company) throw new ApiError(403, "Company not found or access denied");
  return company;
};

export const createJobCard = async (req, res) => {
  try {
    const { company_id, vepari_id, design_id, broker_id, total_pieces, notes } = req.body;

    if (!total_pieces || !vepari_id || !design_id) {
      throw new ApiError(400, "total_pieces, vepari_id, and design_id are required fields");
    }

    const company = await verifyCompany(req.user._id, company_id);
    const companyId = company._id;

    const design = await Design.findOne({ _id: design_id, company_id: companyId });
    if (!design) throw new ApiError(404, "Design not found");

    const vepari = await Vepari.findOne({ _id: vepari_id, company_id: companyId });
    if (!vepari) throw new ApiError(404, "Vepari not found");

    let brokerRate = 0;
    if (broker_id) {
      const broker = await Broker.findOne({ _id: broker_id, company_id: companyId });
      if (!broker) throw new ApiError(404, "Broker not found");
      brokerRate = broker.commission_rate || 0;
    }

    const amounts = JobCard.calculateAmounts(design, total_pieces, brokerRate);
    const firmInitial = company.firm_name.charAt(0).toUpperCase();
    const job_card_number = await Counter.nextSequence("JC", companyId, firmInitial);

    const jobCard = await JobCard.create({
      company_id: companyId,
      vepari_id,
      design_id,
      broker_id: broker_id || null,
      job_card_number,
      total_pieces,
      notes,
      ...amounts,
    });

    return res.status(201).json(new ApiResponse(201, jobCard, "Job Card created successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const listJobCards = async (req, res) => {
  try {
    const { company_id, status, vepari_id, broker_id, from, to, page = 1, limit = 20 } = req.query;

    const query = {};
    if (company_id) {
      const company = await verifyCompany(req.user._id, company_id);
      query.company_id = company._id;
    } else {
      const userCompanies = await Company.find({ userId: req.user._id }).select("_id");
      const companyIds = userCompanies.map(c => c._id);
      query.company_id = { $in: companyIds };
    }
    if (status) query.status = status;
    if (vepari_id) query.vepari_id = vepari_id;
    if (broker_id) query.broker_id = broker_id;
    if (from || to) {
      query.created_at = {};
      if (from) query.created_at.$gte = new Date(from);
      if (to) query.created_at.$lte = new Date(to);
    }

    const jobCards = await JobCard.find(query)
      .populate("company_id", "firm_name")
      .populate("vepari_id", "name company_name phone")
      .populate("design_id", "design_number stitch_count image_url")
      .populate("broker_id", "name phone commission_rate")
      .populate({
        path: "challans",
        populate: { path: "company_id", select: "firm_name" }
      })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ created_at: -1 });

    const total = await JobCard.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, { data: jobCards, total, page: Number(page), limit: Number(limit) }, "Job Cards retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const getJobCardDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.query;

    const company = await verifyCompany(req.user._id, company_id);
    const companyId = company._id;

    const jobCard = await JobCard.findOne({ _id: id, company_id: companyId })
      .populate("vepari_id")
      .populate("design_id")
      .populate("broker_id")
      .populate("challans");

    if (!jobCard) throw new ApiError(404, "Job Card not found or access denied");

    return res.status(200).json(new ApiResponse(200, jobCard, "Job Card details retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const updateJobCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, status } = req.body;

    if (!["PENDING", "IN_PROCESS", "COMPLETED", "CANCELLED"].includes(status)) {
      throw new ApiError(400, "Invalid status");
    }

    const company = await verifyCompany(req.user._id, company_id);
    const companyId = company._id;

    const jobCard = await JobCard.findOneAndUpdate(
      { _id: id, company_id: companyId },
      { status },
      { returnDocument: "after" }
    );

    if (!jobCard) throw new ApiError(404, "Job Card not found");

    return res.status(200).json(new ApiResponse(200, jobCard, "Status updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const editJobCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, vepari_id, design_id, broker_id, total_pieces, notes } = req.body;

    const company = await verifyCompany(req.user._id, company_id);
    const companyId = company._id;

    const jobCard = await JobCard.findOne({ _id: id, company_id: companyId });
    if (!jobCard) throw new ApiError(404, "Job Card not found or access denied");

    if (total_pieces !== undefined) {
      const newTotal = Number(total_pieces);
      if (newTotal < jobCard.inward_pieces) {
        throw new ApiError(400, `Total pieces cannot be less than inward pieces (${jobCard.inward_pieces})`);
      }
      jobCard.total_pieces = newTotal;
    }

    if (vepari_id) {
      const vepari = await Vepari.findOne({ _id: vepari_id, company_id: companyId });
      if (!vepari) throw new ApiError(404, "Vepari not found");
      jobCard.vepari_id = vepari_id;
    }

    if (design_id) {
      const design = await Design.findOne({ _id: design_id, company_id: companyId });
      if (!design) throw new ApiError(404, "Design not found");
      jobCard.design_id = design_id;
    }

    if (broker_id !== undefined) {
      jobCard.broker_id = broker_id || null;
    }

    if (notes !== undefined) {
      jobCard.notes = notes;
    }

    // Recalculate amounts
    const design = await Design.findById(jobCard.design_id);
    let brokerRate = 0;
    if (jobCard.broker_id) {
      const broker = await Broker.findById(jobCard.broker_id);
      if (broker) brokerRate = broker.commission_rate || 0;
    }
    const amounts = JobCard.calculateAmounts(design, jobCard.total_pieces, brokerRate);
    Object.assign(jobCard, amounts);

    await jobCard.save();

    const updated = await JobCard.findById(jobCard._id)
      .populate("company_id", "firm_name")
      .populate("vepari_id", "name company_name phone")
      .populate("design_id", "design_number stitch_count image_url")
      .populate("broker_id", "name phone commission_rate");

    return res.status(200).json(new ApiResponse(200, updated, "Job Card updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};


export const logInward = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, pieces, vehicle_number, notes } = req.body;

    const issuingCompany = await verifyCompany(req.user._id, company_id);

    const jobCard = await JobCard.findById(id);
    if (!jobCard) throw new ApiError(404, "Job card not found");

    await verifyCompany(req.user._id, jobCard.company_id);

    const parsedPieces = Number(pieces);
    if (!parsedPieces || parsedPieces <= 0) throw new ApiError(400, "Valid number of pieces is required");

    const newInward = jobCard.inward_pieces + parsedPieces;
    if (newInward > jobCard.total_pieces) {
      throw new ApiError(
        400,
        `Cannot receive ${parsedPieces} pieces. Only ${jobCard.total_pieces - jobCard.inward_pieces} remaining.`
      );
    }

    const firmInitial = issuingCompany.firm_name.charAt(0).toUpperCase();
    const challan_number = await Counter.nextSequence("CH_IN", issuingCompany._id, firmInitial);
    const challan = await Challan.create({
      company_id: issuingCompany._id,
      job_card_id: id,
      challan_number,
      challan_type: "INWARD",
      pieces: parsedPieces,
      vehicle_number,
      notes,
      issued_by: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, challan, "Inward challan generated successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

export const logOutward = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, pieces, vehicle_number, notes } = req.body;

    const issuingCompany = await verifyCompany(req.user._id, company_id);

    const jobCard = await JobCard.findById(id);
    if (!jobCard) throw new ApiError(404, "Job card not found");

    await verifyCompany(req.user._id, jobCard.company_id);

    const parsedPieces = Number(pieces);
    if (!parsedPieces || parsedPieces <= 0) throw new ApiError(400, "Valid number of pieces is required");

    const newOutward = jobCard.outward_pieces + parsedPieces;
    if (newOutward > jobCard.inward_pieces) {
      throw new ApiError(
        400,
        `Cannot dispatch ${parsedPieces} pieces. Only ${jobCard.inward_pieces - jobCard.outward_pieces} ready for outward.`
      );
    }

    const firmInitial = issuingCompany.firm_name.charAt(0).toUpperCase();
    const challan_number = await Counter.nextSequence("CH_OUT", issuingCompany._id, firmInitial);
    const challan = await Challan.create({
      company_id: issuingCompany._id,
      job_card_id: id,
      challan_number,
      challan_type: "OUTWARD",
      pieces: parsedPieces,
      vehicle_number,
      notes,
      issued_by: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, challan, "Outward challan generated successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
