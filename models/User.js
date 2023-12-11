const mongoose = require("mongoose")


// PASSWORD SHOULD BE MAX 72 - everything past 72nd character is not actually used to create hash
const userSchema = mongoose.Schema({
    username:{
        type:String,
        require:true,
        min:3,
        max:256
    },
    email:{
        type:String,
        require:true,
        min:6,
        max:256
    },
    password:{
        type:String,
        require:true,
        min:6,
        max:1024

    },
    date:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model('users', userSchema)
