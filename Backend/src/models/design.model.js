import mongoose, { Schema } from "mongoose";

const partSchema = new Schema({
  part_name: { type: String, required: true },
  stitch_count: { type: Number, required: true, min: 0 },
  head_count: { type: Number, required: true, min: 1 },
  stitch_rate: { type: Number, required: true, min: 0 }
}, { _id: false });

const designSchema = new Schema(
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
      index: true,
    },
    design_number: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String },
    stitch_count: {
      type: Number,
      min: [0, "Stitch count must be greater than or equal to 0"],
      validate: {
        validator: Number.isInteger,
        message: "Stitch count must be a whole number",
      },
    },
    rate_per_1000: {
      type: Number,
      min: [0, "Rate cannot be negative"],
    },
    parts: { type: [partSchema], default: [] },
    image_url: { type: String },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: design_number is unique per vepari (party) within a company

//  CALCULATED VIRTUAL: total_design_value = (stitch_count / 1000) * rate_per_1000
designSchema.virtual("total_design_value").get(function () {
  if (this.parts && this.parts.length > 0) {
    let total = 0;
    for (const part of this.parts) {
      total += (part.stitch_count / 1000) * part.head_count * part.stitch_rate;
    }
    return Math.round(total * 100) / 100;
  }
  if (!this.stitch_count || !this.rate_per_1000) return 0;
  return Math.round(((this.stitch_count / 1000) * this.rate_per_1000) * 100) / 100;
});


//  CALCULATED VIRTUAL: rate_per_piece (alias for single piece rate)
designSchema.virtual("rate_per_piece").get(function () {
  if (this.parts && this.parts.length > 0) {
    let total = 0;
    for (const part of this.parts) {
      total += (part.stitch_count / 1000) * part.head_count * part.stitch_rate;
    }
    return Math.round(total * 100) / 100;
  }
  if (!this.stitch_count || !this.rate_per_1000) return 0;
  return Math.round(((this.stitch_count / 1000) * this.rate_per_1000) * 100) / 100;
});

const Design = mongoose.model("Design", designSchema);
export default Design;
