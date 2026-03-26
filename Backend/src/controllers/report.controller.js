import mongoose from "mongoose";
import JobCard from "../models/jobcard.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


export const getPendingStock = async (req, res) => {
    try {
        const { company_id } = req.query;
        if (!company_id) throw new ApiError(400, "company_id is required");

        const data = await JobCard.aggregate([
            {
                $match: {
                    company_id: new mongoose.Types.ObjectId(company_id),
                    status: { $in: ["PENDING", "IN_PROCESS"] },
                },
            },
            {
                $addFields: {
                    pending_pieces: { $subtract: ["$inward_pieces", "$outward_pieces"] },
                },
            },
            { $match: { pending_pieces: { $gt: 0 } } },
            {
                $lookup: {
                    from: "veparis",
                    localField: "vepari_id",
                    foreignField: "_id",
                    as: "vepari",
                },
            },
            {
                $lookup: {
                    from: "designs",
                    localField: "design_id",
                    foreignField: "_id",
                    as: "design",
                },
            },
            { $unwind: "$vepari" },
            { $unwind: "$design" },
            {
                $project: {
                    job_card_number: 1,
                    status: 1,
                    total_pieces: 1,
                    inward_pieces: 1,
                    outward_pieces: 1,
                    pending_pieces: 1,
                    "vepari.name": 1,
                    "vepari.company_name": 1,
                    "design.design_number": 1,
                    "design.stitch_count": 1,
                },
            },
        ]);

        return res.status(200).json(new ApiResponse(200, data, "Pending stock report fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
        return res.status(500).json({ message: error.message || "Internal server error", success: false });
    }
};


export const getBrokerCommission = async (req, res) => {
    try {
        const { company_id, from, to } = req.query;
        if (!company_id) throw new ApiError(400, "company_id is required");

        const matchStage = {
            company_id: new mongoose.Types.ObjectId(company_id),
            broker_id: { $ne: null },
        };

        if (from || to) {
            matchStage.created_at = {};
            if (from) matchStage.created_at.$gte = new Date(from);
            if (to) matchStage.created_at.$lte = new Date(to);
        }

        const data = await JobCard.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$broker_id",
                    total_jobs: { $sum: 1 },
                    total_amount: { $sum: "$total_amount" },
                    total_commission: { $sum: "$broker_commission_amount" },
                },
            },
            {
                $lookup: {
                    from: "brokers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "broker",
                },
            },
            { $unwind: "$broker" },
            {
                $project: {
                    "broker.name": 1,
                    "broker.phone": 1,
                    "broker.commission_rate": 1,
                    total_jobs: 1,
                    total_amount: 1,
                    total_commission: 1,
                },
            },
        ]);

        return res.status(200).json(new ApiResponse(200, data, "Broker commission report fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
        return res.status(500).json({ message: error.message || "Internal server error", success: false });
    }
};


export const getVepariLedger = async (req, res) => {
    try {
        const { company_id, vepari_id } = req.query;
        if (!company_id || !vepari_id) throw new ApiError(400, "company_id and vepari_id are required");

        const data = await JobCard.find({ company_id, vepari_id })
            .populate("design_id", "design_number stitch_count rate_per_1000")
            .populate("broker_id", "name")
            .populate("challans")
            .sort({ created_at: -1 });

        return res.status(200).json(new ApiResponse(200, data, "Vepari ledger fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
        return res.status(500).json({ message: error.message || "Internal server error", success: false });
    }
};


export const getProductionSummary = async (req, res) => {
    try {
        const { company_id, from, to } = req.query;
        if (!company_id) throw new ApiError(400, "company_id is required");

        const matchStage = { company_id: new mongoose.Types.ObjectId(company_id) };
        if (from || to) {
            matchStage.created_at = {};
            if (from) matchStage.created_at.$gte = new Date(from);
            if (to) matchStage.created_at.$lte = new Date(to);
        }

        const data = await JobCard.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total_jobs: { $sum: 1 },
                    total_pieces: { $sum: "$total_pieces" },
                    total_inward: { $sum: "$inward_pieces" },
                    total_outward: { $sum: "$outward_pieces" },
                    total_pending: {
                        $sum: { $subtract: ["$inward_pieces", "$outward_pieces"] },
                    },
                    total_revenue: { $sum: "$total_amount" },
                    total_commission: { $sum: "$broker_commission_amount" },
                },
            },
        ]);

        return res.status(200).json(new ApiResponse(200, data, "Production summary fetched successfully"));
    } catch (error) {
        if (error instanceof ApiError) return res.status(error.statusCode).json({ message: error.message, success: false });
        return res.status(500).json({ message: error.message || "Internal server error", success: false });
    }
};
