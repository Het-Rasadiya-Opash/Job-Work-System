import mongoose, { Schema } from "mongoose";

const vepariSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    broker_id: {
      type: Schema.Types.ObjectId,
      ref: "Broker",
    },
    name: { type: String, required: true, trim: true },
    company_name: { type: String, trim: true },
    gstin: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "Invalid GSTIN format",
      ],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid phone number"],
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true }, // added
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// vepariSchema.index({ company_id: 1, phone: 1 }, { unique: true });

// vepariSchema.index({ company_id: 1, gstin: 1 }, { unique: true, sparse: true });

vepariSchema.virtual("job_cards", {
  ref: "JobCard",
  localField: "_id",
  foreignField: "vepari_id",
});

const Vepari = mongoose.model("Vepari", vepariSchema);

export default Vepari;
