const express = require('express');
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")


const router = express.Router();

//create new account
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)

//get all account of the logged-in user
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountController)

//account balance check
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)


module.exports = router;