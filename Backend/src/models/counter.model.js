import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema({
  // key format: "JC:companyId:2024" or "CH_IN:companyId:2024"
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.statics.nextSequence = async function (prefix, companyId, firmInitial) {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const key = `${prefix}:${companyId}:${year}`;
  const result = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const padded = String(result.seq).padStart(4, "0");

  const prefixMap = {
    JC: `${firmInitial}-JC-${year}-${padded}`,
    CH_IN: `${firmInitial}-CH-IN-${year}-${padded}`,
    CH_OUT: `${firmInitial}-CH-OUT-${year}-${padded}`,
  };
  return prefixMap[prefix] ?? `${firmInitial}-${prefix}-${year}-${padded}`;
};

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
