const mongoose = require('mongoose')
const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")



async function createTransaction (req, res) {
    // validate request
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if(!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message : "from account, to account, amount, idempotency key are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id : fromAccount
    })
    const toUserAccount = await accountModel.findOne({
        _id : toAccount
    })


    if(!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message : "invalid fromAccount or toAccount"
        })
    }

    // validate idempotency
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey : idempotencyKey
    })

    if(isTransactionAlreadyExists) {
        if(isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message : "transaction already processed",
                transaction : isTransactionAlreadyExists
            })
        }
        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message : "transaction is pending"
            })
        }
        if(isTransactionAlreadyExists.status === "FAILED") {
            return res.status(200).json({
                message : "transaction failed"
            })
        }
        if(isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(200).json({
                message : "transaction reversed"
            })
        }
    }

    // check account stutas
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message : "both account must be active"
        })
    }

    // derive sender balance from ledger
    const balance = await fromUserAccount.getBalance()

    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message : `insufficient balance in fromAccount. current balance is ${balance}. requested amount is ${amount}`
      });
    }

    // create transaction
    let transaction;
    console.log("transaction : "+ transaction)
    try{
        const session = await mongoose.startSession()
        session.startTransaction()
        
        [transaction] = await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session })
        
        const debitLedgerEntry = await ledgerModel.create([ {
            account : fromAccount,
            amount : amount,
            transaction : transaction._id,
            type : "DEBIT"
        } ], {session})
        
        await (() => {
            return new Promise((resolve) => setTimeout(resolve, 4 * 1000))
        })()
        
        const creditLedgerEntry = await ledgerModel.create([ {
            account : toAccount,
            amount : amount,
            transaction : transaction._id,
            type : "CREDIT",
        } ], {session})
        
        await transactionModel.findOneAndUpdate(
            { _id : transaction._id },
            { status : "COMPLETED" },
            { session }
        )
        
        await session.commitTransaction()
        session.endSession()
    }
    catch(error){
        
        return res.status(500).json({
            message : "transaction due to internal error, please retry after sometime",
            error : error
        })
    }
        
    // send email notification
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message : "transaction completed successfully",
        transaction : transaction
    })
}


async function createInitialFundsTransaction(req, res) {
    const {toAccount, amount, idempotencyKey} = req.body

    if(!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message : "all are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id : toAccount
    })

    if(!toUserAccount) {
        return res.status(400).json({
            message : "invalid account"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        
        user : req.user._id
    })

    if(!fromUserAccount) {
        return res.status(400).json({
            message : "system user account not found"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount : fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status : "PENDING",

    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account : fromUserAccount._id,
        amount : amount,
        transaction : transaction._id,
        type : "DEBIT",
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account : toAccount,
        amount : amount,
        transaction : transaction._id,
        type : "CREDIT",
    } ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message : "initial funds transaction completed successfully",
        transaction : transaction
    })
}

module.exports = { createTransaction, createInitialFundsTransaction}