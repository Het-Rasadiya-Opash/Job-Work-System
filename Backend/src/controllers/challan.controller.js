import Challan from "../models/challan.model.js";
import Company from "../models/company.model.js";
import JobCard from "../models/jobcard.model.js";
import Counter from "../models/counter.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * @desc    Get complete data for printing a challan
 * @route   GET /api/challan/:id/print
 * @access  Private
 */
export const printChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.query;

    if (!company_id) {
      throw new ApiError(400, "company_id is required");
    }

    // 1. Fetch Challan and populate JobCard -> Design, Vepari
    const challan = await Challan.findOne({ _id: id, company_id })
      .populate({
        path: "job_card_id",
        populate: [
          { path: "design_id" },
          { path: "vepari_id" }
        ]
      });

    if (!challan) {
      throw new ApiError(404, "Challan not found or access denied");
    }

    // 2. Fetch Company details (Firm details) for the header
    const company = await Company.findById(company_id);
    if (!company) {
      throw new ApiError(404, "Firm details not found");
    }

    // 3. Structured data for the frontend print component
    const printData = {
      challan_number: challan.challan_number,
      challan_type: challan.challan_type,
      pieces: challan.pieces,
      vehicle_number: challan.vehicle_number,
      notes: challan.notes,
      created_at: challan.created_at,
      
      // Job Card Info
      job_card: {
        number: challan.job_card_id?.job_card_number,
        total_pieces: challan.job_card_id?.total_pieces,
        status: challan.job_card_id?.status,
      },
      
      // Design Info
      design: {
        number: challan.job_card_id?.design_id?.design_number,
        stitch_count: challan.job_card_id?.design_id?.stitch_count,
        rate: challan.job_card_id?.design_id?.rate_per_1000,
        image_url: challan.job_card_id?.design_id?.image_url,
      },
      
      // Vepari (Customer) Info
      vepari: {
        name: challan.job_card_id?.vepari_id?.name,
        company_name: challan.job_card_id?.vepari_id?.company_name,
        phone: challan.job_card_id?.vepari_id?.phone,
        address: challan.job_card_id?.vepari_id?.address,
        gstin: challan.job_card_id?.vepari_id?.gstin,
      },
      
      // Firm (Your Company) Info
      firm: {
        name: company.firm_name,
        gstin: company.gstin,
        address: company.address,
        city: company.city,
        state: company.state,
        pincode: company.pincode,
        phone: company.phone,
        logo_url: company.logo_url,
      }
    };

    return res
      .status(200)
      .json(new ApiResponse(200, printData, "Challan print data retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

/**
 * @desc    List all challans for a company
 * @route   GET /api/challan
 * @access  Private
 */
export const listChallans = async (req, res) => {
  try {
    const { company_id, type, page = 1, limit = 20 } = req.query;

    const query = {};
    if (company_id) {
       const company = await Company.findOne({ _id: company_id, userId: req.user._id });
       if (!company) throw new ApiError(403, "Access denied");
       query.company_id = company_id;
    } else {
       const userCompanies = await Company.find({ userId: req.user._id }).select("_id");
       const companyIds = userCompanies.map(c => c._id);
       query.company_id = { $in: companyIds };
    }
    if (type) query.challan_type = type;

    const challans = await Challan.find(query)
      .populate("company_id", "firm_name")
      .populate({
        path: "job_card_id",
        select: "job_card_number",
        populate: [
          { path: "vepari_id", select: "name" },
          { path: "design_id", select: "design_number" }
        ]
      })
      .sort({ created_at: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Challan.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, {
      data: challans,
      total,
      page: Number(page),
      limit: Number(limit)
    }, "Challans retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};

/**
 * @desc    Edit an existing challan (pieces, firm, vehicle, notes)
 * @route   PUT /api/challan/:id
 * @access  Private
 */
export const editChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, pieces, vehicle_number, notes } = req.body;

    if (!company_id) throw new ApiError(400, "company_id is required");

    // Verify the user owns the company
    const userCompanies = await Company.find({ userId: req.user._id }).select("_id");
    const companyIds = userCompanies.map(c => c._id.toString());

    const challan = await Challan.findById(id);
    if (!challan) throw new ApiError(404, "Challan not found");

    if (!companyIds.includes(challan.company_id.toString())) {
      throw new ApiError(403, "Access denied");
    }

    const jobCard = await JobCard.findById(challan.job_card_id);
    if (!jobCard) throw new ApiError(404, "Associated Job Card not found");

    const oldPieces = challan.pieces;
    const newPieces = pieces !== undefined ? Number(pieces) : oldPieces;
    const diff = newPieces - oldPieces;

    if (newPieces < 1) throw new ApiError(400, "Pieces must be at least 1");

    // Validate inventory limits
    if (challan.challan_type === "INWARD") {
      const newInward = jobCard.inward_pieces + diff;
      if (newInward > jobCard.total_pieces) {
        throw new ApiError(400, `Cannot set ${newPieces} pieces. Max inward allowed: ${jobCard.total_pieces - jobCard.inward_pieces + oldPieces}`);
      }
      if (newInward < jobCard.outward_pieces) {
        throw new ApiError(400, `Cannot reduce below outward pieces (${jobCard.outward_pieces})`);
      }
      jobCard.inward_pieces = newInward;
    } else {
      const newOutward = jobCard.outward_pieces + diff;
      if (newOutward > jobCard.inward_pieces) {
        throw new ApiError(400, `Cannot set ${newPieces} pieces. Max outward allowed: ${jobCard.inward_pieces - jobCard.outward_pieces + oldPieces}`);
      }
      if (newOutward < 0) {
        throw new ApiError(400, "Outward pieces cannot be negative");
      }
      jobCard.outward_pieces = newOutward;
    }

    // Update challan fields
    if (pieces !== undefined) challan.pieces = newPieces;
    if (company_id && company_id !== challan.company_id.toString()) {
      if (!companyIds.includes(company_id)) throw new ApiError(403, "Invalid company_id");
      const newCompany = await Company.findById(company_id);
      if (!newCompany) throw new ApiError(404, "Company not found");
      challan.company_id = company_id;
      // Generate a new unique challan number for the new firm
      const newInitial = newCompany.firm_name.charAt(0).toUpperCase();
      const counterPrefix = challan.challan_type === "INWARD" ? "CH_IN" : "CH_OUT";
      challan.challan_number = await Counter.nextSequence(counterPrefix, company_id, newInitial);
    }
    if (vehicle_number !== undefined) challan.vehicle_number = vehicle_number;
    if (notes !== undefined) challan.notes = notes;

    // Save jobCard first (triggers inventory guards & status), then challan without post-save hook
    await jobCard.save();
    await Challan.findByIdAndUpdate(id, {
      pieces: challan.pieces,
      company_id: challan.company_id,
      challan_number: challan.challan_number,
      vehicle_number: challan.vehicle_number,
      notes: challan.notes,
    });

    const updated = await Challan.findById(id).populate("company_id", "firm_name");

    return res.status(200).json(new ApiResponse(200, updated, "Challan updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
