const mongoose = require("mongoose");

const householdSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  children: [{ name: { type: String, trim: true, required: true }, age: { type: Number, min: 0, max: 18 } }],
  invitations: [{ email: { type: String, required: true }, tokenHash: { type: String, required: true }, expiresAt: { type: Date, required: true } }],
}, { timestamps: true });

householdSchema.index({ members: 1 }, { unique: true });
module.exports = mongoose.model("Household", householdSchema);
