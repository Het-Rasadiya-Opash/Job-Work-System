import mongoose, { Schema } from "mongoose";

const designPartSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    part_name: { type: String, required: true, trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

designPartSchema.index({ company_id: 1, part_name: 1 }, { unique: true });

const DesignPart = mongoose.model("DesignPart", designPartSchema);
export default DesignPart;
