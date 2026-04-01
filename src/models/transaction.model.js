const mongoose = require('mongoose');


const transactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "transaction must be associated with a from account"],
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "transaction must be associated with a to account"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
        message: "status must be PENDING, COMPLETED, FAILED or REVERSED",
      },
      default: "PENDING", // ✅ FIXED
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount can't be negative"],
    },
    idempotencyKey: {
      type: String,
      required: [true, "IdempotencyKey is required"],
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

const transactionModel = mongoose.model("transaction", transactionSchema)



module.exports = transactionModel