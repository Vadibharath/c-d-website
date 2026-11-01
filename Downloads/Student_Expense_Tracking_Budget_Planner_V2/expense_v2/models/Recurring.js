const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  frequency: { type: String, enum: ["monthly", "weekly"], default: "monthly" },
  nextDue: { type: Date, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model("Recurring", schema);
