import mongoose, { Schema } from "mongoose";

const companySchema = new Schema(
  {
    firm_name: { type: String, required: true, trim: true, unique: true },
    gstin: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      validate: {
        validator: function (v) {
          if (!v || v === "") return true;
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: "Invalid GSTIN format",
      },
    },
    address: { type: String, required: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: {
      type: String,
      trim: true,
      match: [/^[0-9]{6}$/, "Pincode must be 6 digits"],
    },
    phone: { type: String, trim: true },
    logo_url: { type: String },
    isDefault: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Company = mongoose.model("Company", companySchema);
export default Company;
