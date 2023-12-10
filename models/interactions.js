const mongoose = require("mongoose")


// PASSWORD SHOULD BE MAX 72 - else is not actually used to create hash
const interactionSchema = mongoose.Schema({
    type:{
        type:Enum,
        require:true,
        min:3,
        max:256
    },
    category:{
        type:String,
        require:true,
        min:6,
        max:256
    },
    message:{
        type:String,
        require:true,
        min:1,
        max:4096

    },
    expirationTime:{
        type: int,
        require:true,
        default:5
    },
    postOwner:{
        type: String,
        require: true
    },

    date:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model('interactions', interactionSchema)