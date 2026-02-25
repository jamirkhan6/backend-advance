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
        if(isTransactionAlreadyExists.status === "PANDING"){
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
    if(fromUserAccount !== "ACTIVE" || toUserAccount !== "ACTIVE") {
        return res.status(400).json({
            message : "both account must be active"
        })
    }

    // derive sender balance from ledger
    const balance = await fromUserAccount.getBalance()

    if(balance < amount) {
        return res.status(400).json({
            message : `insufficient balance in fromAccount. current balance is ${balance}. requested amount is ${amount}`
        })
    }

    // create transaction
    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }, {session})

    const debitLedgerEntry = await ledgerModel.create({
        account : fromAccount,
        amount : amount,
        transaction : transaction._id,
        type : "DEBIT"
    }, {session})

    const creditLedgerEntry = await ledgerModel.create({
        account : toAccount,
        amount : amount,
        transaction : transaction._id,
        type : "CREDIT",
    }, {session})

    transaction.status = "COMPLETED"
    await transaction.save({session})


    await session.commitTransaction()
    session.endSession()

    // send email notification
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message : "transaction completed successfully",
        transaction : transaction
    })
}



module.exports = { createTransaction }