const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")





async function createTransaction (req, res) {
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
        if()
    }
}