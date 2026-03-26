import mongoose, { Schema } from "mongoose";

const CHALLAN_TYPE = ["INWARD", "OUTWARD"];

const challanSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    job_card_id: {
      type: Schema.Types.ObjectId,
      ref: "JobCard",
      required: true,
    },

    // Auto-generated: CH-IN-2024-0001 or CH-OUT-2024-0001
    challan_number: { type: String, required: true },

    challan_type: {
      type: String,
      enum: CHALLAN_TYPE,
      required: true,
    },
    pieces: {
      type: Number,
      required: true,
      min: [1, "Pieces must be at least 1"],
    },
    vehicle_number: { type: String, trim: true, uppercase: true },
    notes: { type: String },
    issued_by: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: challan_number unique per company
challanSchema.index({ company_id: 1, challan_number: 1 }, { unique: true });

// ── Post-save Middleware: Update JobCard inventory after challan creation ─────
challanSchema.post("save", async function (doc) {
  const JobCard = mongoose.model("JobCard");
  const field =
    doc.challan_type === "INWARD" ? "inward_pieces" : "outward_pieces";

  const jobCard = await JobCard.findById(doc.job_card_id);
  if (!jobCard) return;

  jobCard[field] += doc.pieces;
  await jobCard.save(); // triggers pre-save for inventory guards & status
});

const Challan = mongoose.model("Challan", challanSchema);
export default Challan;
