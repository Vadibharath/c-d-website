const mongoose = require("mongoose");
const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
  amount: { type: Number, required: true, min: 0.01 },
  dailyLimit: { type: Number, min: 0, default: 0 }
}, { timestamps: true });
budgetSchema.index({ user: 1, month: 1 }, { unique: true });
module.exports = mongoose.model("Budget", budgetSchema);
