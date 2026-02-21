const mongoose = require('mongoose');



function connectDB() {
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("server is connceted to db")
    }).catch(error => {
        console.log("error connecting to db : " + error)
        process.exit(1)
    })
}



module.exports = connectDB;