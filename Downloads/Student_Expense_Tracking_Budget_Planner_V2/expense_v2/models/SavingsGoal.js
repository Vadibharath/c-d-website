const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  targetAmount: { type: Number, required: true, min: 0.01 },
  savedAmount: { type: Number, default: 0, min: 0 },
  targetDate: { type: Date, default: null }
}, { timestamps: true });
module.exports = mongoose.model("SavingsGoal", schema);
