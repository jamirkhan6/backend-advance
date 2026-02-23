const jwt = require('jsonwebtoken')
const userModel = require("../models/user.model");



async function authMiddleware(req, res, next) {
    const token = req.cookies.jwt_token || req.headers.authorization?.split("")[1]

    if(!token) {
        return res.status(401).json({
            message : "Unauthorized access, token is missing"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId)

        req.user = user

        return next()
    } catch (error) {
        return res.status(401).json({
            message : "token is invalid"
        })
    }
}


module.exports = { authMiddleware }