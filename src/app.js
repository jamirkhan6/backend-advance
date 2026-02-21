const express = require('express');
const cookieParse = require('cookie-parser');
const authRouter = require("./routes/auth.routes")



const app = express();

app.use(express.json())
app.use(cookieParse())

app.use("/api/auth", authRouter)

module.exports = app;