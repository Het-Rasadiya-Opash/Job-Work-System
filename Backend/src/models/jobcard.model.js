import mongoose, { Schema } from "mongoose";

const JOB_STATUS = ["PENDING", "IN_PROCESS", "COMPLETED", "CANCELLED"];

const jobCardSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    vepari_id: {
      type: Schema.Types.ObjectId,
      ref: "Vepari",
      required: true,
    },
    design_id: {
      type: Schema.Types.ObjectId,
      ref: "Design",
      required: true,
    },
    broker_id: {
      type: Schema.Types.ObjectId,
      ref: "Broker",
      default: null,
    },

    // Auto-generated: JC-2024-0001 (scoped per company)
    job_card_number: { type: String, required: true },

    status: {
      type: String,
      enum: JOB_STATUS,
      default: "PENDING",
    },

// ── Inventory ──────────────────────────────
    total_pieces: {
      type: Number,
      required: true,
      min: [1, "Total pieces must be at least 1"],
    },
    inward_pieces: {
      type: Number,
      default: 0,
      min: [0, "Inward pieces cannot be negative"],
    },
    outward_pieces: {
      type: Number,
      default: 0,
      min: [0, "Outward pieces cannot be negative"],
    },

    // ── Rate Snapshot (frozen at creation time) ─
    parts: {
      type: [
        {
          part_name: { type: String, required: true },
          stitch_count: { type: Number, required: true, min: 0 },
          head_count: { type: Number, required: true, min: 1 },
          stitch_rate: { type: Number, required: true, min: 0 }
        }
      ],
      default: [],
      comment: "Snapshot of design parts at creation",
    },
    stitch_count: {
      type: Number,
      default: 0,
      comment: "Copied from Design at creation — frozen so rate changes don't affect past cards",
    },
    rate_per_1000: {
      type: Number,
      default: 0,
      comment: "Copied from Design at creation — frozen",
    },
    rate_per_piece: {
      type: Number,
      required: true,
      comment: "= (stitch_count / 1000) * rate_per_1000, calculated at creation",
    },
    total_amount: {
      type: Number,
      required: true,
      comment: "= rate_per_piece * total_pieces",
    },
    broker_commission_amount: {
      type: Number,
      default: 0.0,
      comment: "= total_amount * (broker.commission_rate / 100)",
    },

    notes: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: job_card_number unique per company
jobCardSchema.index({ company_id: 1, job_card_number: 1 }, { unique: true });

//  CALCULATED VIRTUAL: pending_pieces = inward - outward
jobCardSchema.virtual("pending_pieces").get(function () {
  return this.inward_pieces - this.outward_pieces;
});

// Virtual: all challans for this job card
jobCardSchema.virtual("challans", {
  ref: "Challan",
  localField: "_id",
  foreignField: "job_card_id",
});

// ── Pre-save Middleware: Inventory Guards & Auto Status ──────────────────────
jobCardSchema.pre("save", function () {
  // Guard: inward cannot exceed total
  if (this.inward_pieces > this.total_pieces) {
    throw new Error(
      `Inward pieces (${this.inward_pieces}) cannot exceed total pieces (${this.total_pieces})`
    );
  }

  // Guard: outward cannot exceed inward
  if (this.outward_pieces > this.inward_pieces) {
    throw new Error(
      `Outward pieces (${this.outward_pieces}) cannot exceed inward pieces (${this.inward_pieces})`
    );
  }

  // Auto status transitions
  if (this.outward_pieces > 0 && this.outward_pieces === this.inward_pieces) {
    this.status = "COMPLETED";
  } else if (this.inward_pieces > 0 && this.status === "PENDING") {
    this.status = "IN_PROCESS";
  }
});

// ── Static: Calculate amounts from design ────────────────────────────────────
jobCardSchema.statics.calculateAmounts = function (design, totalPieces, brokerRate = 0) {
  let ratePerPiece = 0;
  let totalStitchCount = 0;
  let ratePer1000 = 0;

  if (design.parts && design.parts.length > 0) {
    let total = 0;
    for (const part of design.parts) {
      total += (part.stitch_count / 1000) * part.head_count * part.stitch_rate;
      totalStitchCount += part.stitch_count;
    }
    ratePerPiece = Math.round(total * 100) / 100;
  } else {
    ratePerPiece = Math.round(((design.stitch_count / 1000) * design.rate_per_1000) * 100) / 100;
    totalStitchCount = design.stitch_count || 0;
    ratePer1000 = design.rate_per_1000 || 0;
  }

  const totalAmount = Math.round(ratePerPiece * totalPieces * 100) / 100;
  const brokerCommission = Math.round(totalAmount * (brokerRate / 100) * 100) / 100;

  return {
    parts: design.parts || [],
    stitch_count: totalStitchCount,
    rate_per_1000: ratePer1000,
    rate_per_piece: ratePerPiece || 0,
    total_amount: totalAmount || 0,
    broker_commission_amount: brokerCommission || 0,
  };
};

const JobCard = mongoose.model("JobCard", jobCardSchema);
export default JobCard;
