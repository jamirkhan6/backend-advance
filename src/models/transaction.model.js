const mongoose = require('mongoose');



const transactionSchema = new mongoose.Schema({
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
        values: ["PANDING", "COMPLETED", "FAILED", "REVERSED"],
        message: "stutas can be either PANDING, COMPLETED, FAILED or REVERSED"
    },
    default: "PANDING"
  },
  amount: {
    type: Number,
    required: [true, "Amount is required for creating a transaction"],
    min: [0, "transaction amount can't be negative"]
  },
  idempotencyKey: {
    type: String,
    required: [true, "IdempotencyKey is required for creating a transaction"],
    index: true,
    unique: true
  }
}, {timestamps: true});


const transactionModel = mongoose.model("transaction", transactionSchema)



module.exports = transactionModel