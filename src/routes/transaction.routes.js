const { Router } = require('express')
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")


const transactionRouter = Router()



//create new transaction
transactionRouter.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

//system initial funds
transactionRouter.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)



module.exports = transactionRouter