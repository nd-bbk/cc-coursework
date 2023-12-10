const mongoose = require("mongoose")
ObjectId = mongoose.Schema.ObjectId

const postSchema = mongoose.Schema({
    title:{
        type:String,
        required:true,
        min:3,
        max:256
    },
    // Politics, Health, Sport, Tech
    category:{
        type:[String],
        enum:["Politics", "Health", "Sport", "Tech"],
        required:true,
        default:undefined,
        validate: {
            validator: function(v) {
                return v.length>0;
            },
            message: 'Category is empty'
        },
    },
    message:{
        type:String,
        required:true,
        min:1,
        max:4096
    },
    expirationTime:{
        type: Number,
        required:true,
        default:5
    },
    postOwner:{
      type: ObjectId,
      required: true
    },
    likes:{
        type: [ObjectId],
        default: []
    },
    dislikes:{
        type: [ObjectId],
        default: []
    },
    postParent:{
        type: ObjectId,
        default: undefined
    },
    expirationDate:{
        type: Date,
        required:true

    }//,
    // ADD EXPIRATION DATE AS DATE - TO FORMAT IT EASIER.


    // date:{
    //     type:Date,
    //     default:Date.now
    // }
})

module.exports = mongoose.model('posts', postSchema)