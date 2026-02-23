const express = require('express');
const cookieParse = require('cookie-parser');
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")



const app = express();

app.use(express.json())
app.use(cookieParse())

app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)

module.exports = app;