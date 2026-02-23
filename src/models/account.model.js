const mongoose = require("mongoose");



const accountSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : [ true, "Account must be associated with a user"]
    },
    status : {
        enum : {
            value : ["ACTIVE", "FROZEN", "CLOSED"],
            message : "status can be either ACRIVE, FROZEN or CLOSED"
        }
    },
    currency : {
        type : String,
        required : [ true, "Currency is required for creating an account"],
        default : "BDT"
    }
}, {
    timestamps : true
})



const accountModel = mongoose.model("account", accountSchema)


module.exports = accountModel;