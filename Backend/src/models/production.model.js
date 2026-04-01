import mongoose, { Schema } from "mongoose";

const productionSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    machine_id: {
      type: Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    employee_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    design_id: {
      type: Schema.Types.ObjectId,
      ref: "Design",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    shift: {
      type: String,
      required: true,
      trim: true,
      enum: ["Day", "Night"],
      default: "Day",
    },
    produced_quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Production = mongoose.model("Production", productionSchema);
export default Production;
