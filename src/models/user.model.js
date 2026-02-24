const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    email : {
        type : String,
        required : [true, "email is required for creating users"],
        trim : true,
        lowercase : true,
        match : [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "invalid email address"],
        unique : [true, "email already exist"]
    },
    name : {
        type : String,
        required : [true, "name is required for creating acccount"]
    },
    password : {
        type : String,
        required : [true, "password is required for creating account"],
        minlength : [6, "password should be more than 6 charecter"],
        select : false
    }
}, { timestamps : true})



userSchema.pre("save", async function() {
    if(!this.isModified("password")) {
        return
    }

    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash

    return 
})


userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password)
}


const userModel = mongoose.model("user", userSchema);




module.exports = userModel;