import mongoose, { Schema } from "mongoose";

const brokerSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternate_phone: { type: String, trim: true },
    commission_rate: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
    },
    address: { type: String },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

brokerSchema.index({ company_id: 1, phone: 1 }, { unique: true });

brokerSchema.virtual("veparis", {
  ref: "Vepari",
  localField: "_id",
  foreignField: "broker_id",
});

const Broker = mongoose.model("Broker", brokerSchema);

export default Broker;
