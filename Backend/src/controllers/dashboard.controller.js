import mongoose from "mongoose";
import JobCard from "../models/jobcard.model.js";
import Vepari from "../models/vepari.model.js";
import Design from "../models/design.model.js";
import Broker from "../models/broker.model.js";
import Challan from "../models/challan.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) throw new ApiError(400, "company_id is required");

    const compId = new mongoose.Types.ObjectId(company_id);

    const [
      vepariCount,
      designCount,
      brokerCount,
      jobCardSummary,
      recentJobCards,
      challanStatsRaw
    ] = await Promise.all([
      Vepari.countDocuments({ company_id: compId }),
      Design.countDocuments({ company_id: compId }),
      Broker.countDocuments({ company_id: compId }),
      JobCard.aggregate([
        { $match: { company_id: compId } },
        { 
          $group: {
            _id: null,
            totalCards: { $sum: 1 },
            totalPieces: { $sum: "$total_pieces" },
            totalRevenue: { $sum: "$total_amount" },
            pendingCards: {
              $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] }
            },
            inProcessCards: {
              $sum: { $cond: [{ $eq: ["$status", "IN_PROCESS"] }, 1, 0] }
            }
          }
        }
      ]),
      // Fetch the 5 most recently created job cards for quick preview
      JobCard.find({ company_id: compId })
        .populate("vepari_id", "name")
        .populate("design_id", "design_number")
        .sort({ created_at: -1 })
        .limit(5),
      Challan.aggregate([
        { $match: { company_id: compId } },
        {
          $group: {
            _id: "$challan_type",
            totalPieces: { $sum: "$pieces" }
          }
        }
      ])
    ]);

    const jcStats = jobCardSummary[0] || {
      totalCards: 0,
      totalPieces: 0,
      totalRevenue: 0,
      pendingCards: 0,
      inProcessCards: 0
    };

    let totalInward = 0;
    let totalOutward = 0;
    challanStatsRaw.forEach(stat => {
      if (stat._id === "INWARD") totalInward = stat.totalPieces;
      if (stat._id === "OUTWARD") totalOutward = stat.totalPieces;
    });

    return res.status(200).json(new ApiResponse(200, {
      summary: {
        veparis: vepariCount,
        designs: designCount,
        brokers: brokerCount,
        jobCards: jcStats.totalCards,
      },
      cards: {
        pending: jcStats.pendingCards,
        inProcess: jcStats.inProcessCards,
      },
      inventory: {
        total: jcStats.totalPieces,
        inward: totalInward,
        outward: totalOutward,
        pending_outward: totalInward - totalOutward 
      },
      financial: {
        totalRevenue: jcStats.totalRevenue
      },
      recentJobCards
    }, "Dashboard stats fetched successfully"));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
    return res.status(500).json({ message: error.message || "Internal server error", success: false });
  }
};
