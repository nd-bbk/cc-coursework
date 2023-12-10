const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Post = require("../models/Post")


const bcryptjs = require("bcryptjs")
const jsonwebtoken = require("jsonwebtoken")
const {registerValidation} = require("../validations/validation");
const verifyToken = require("../verifyToken")

function appendPostData(post){
    // getPostById.creationTime = getPostById._id.getTimestamp()
    const postJson = post.toJSON()
    postJson.creationTime = post._id.getTimestamp()
    postJson.status = (Date.now()-postJson.creationTime>postJson.expirationTime*1000*60) ? "Expired" : "Live"
    // console.log(postJson)
    return postJson
}


router.get('/', verifyToken,  async(req, res)=> {
    console.log('123')
    try{
        const getPosts = await Post.find({'category':"Tech"})
       const postsJson = []
       getPosts.forEach((post) => postsJson.push(appendPostData(post)))
        res.send(postsJson)

    } catch(err){
        res.status(500)
        res.send({message:err})
    }
})

module.exports = router