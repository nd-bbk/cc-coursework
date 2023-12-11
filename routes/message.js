const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Post = require("../models/Post")


const bcryptjs = require("bcryptjs")
const jsonwebtoken = require("jsonwebtoken")
const {registerValidation} = require("../validations/validation");

const verifyToken = require("../verifyToken")


// Helper Function to populate necessary data in reply
async function appendPostData(post) {
    // getPostById.creationTime = getPostById._id.getTimestamp()
    const postJson = post.toJSON()
    postJson.creationTime = post._id.getTimestamp()
    postJson.status = (Date.now() > new Date(postJson.expirationDate).getTime()) ? "Expired" : "Live"
    postJson.numberLikes = postJson.likes.length
    postJson.numberDislikes = postJson.dislikes.length
    try {
        postJson.numberComments = await Post.countDocuments({"postParent": postJson._id})
    } catch {
        // Better to serve some reply, then no reply at all?
        console.log('Unable to connect to DB')
        postJson.numberComments = undefined
    }
    return postJson
}

//POST -> Posts a message
router.post('/', verifyToken, async(req, res) => {
    // TODO: Waiting
    const postData = new Post({
        title: req.body.title,
        category: req.body.category,
        message: req.body.message,
        expirationTime: req.body.expirationTime, // In minutes
        postOwner: req.user._id,
        // IDK why it is so wierd, probably there is an easier way to do it (do it on mongodb side)
        expirationDate: new Date(Date.now()).setMinutes(new Date(Date.now()).getMinutes()+
            (req.body.expirationTime?req.body.expirationTime:Post.schema.path('expirationTime').options.default))
    })

    try {
        const postToSave = await postData.save()
        res.send(postToSave)
        return
    } catch(err) {
        res.status(500)
        res.send({message: err})
        return
    }
})

// GET -> Gets all the posted messages (Including comments, to exclude comments it is possible to add extra filter)
// If query parameter "category" is given -> will filter only to such category
router.get('/', verifyToken ,async(req,res)=>{

    if (req.query.category){
        try{
            const getPosts = await Post.find({"category":req.query.category})
            const postsJson = []

            for await (const post of getPosts) {
                postsJson.push(await appendPostData(post))
            }

            res.send(postsJson)
            return
        } catch(err){
            res.status(500)
            res.send({message:err})
            return
        }
    }
    try{
        const getPosts = await Post.find()
        const postsJson = []
        for (const post of getPosts) {
            postsJson.push( await appendPostData(post))
        }
        res.send(postsJson)
        return

    } catch(err){
        res.status(500)
        res.send({message:err})
        return
    }
})

// GET -> Gets all the expired messages (Including comments)
// If query parameter "category" is given -> will filter only to such category
router.get('/expired', verifyToken ,async(req,res)=>{

    if (req.query.category){
        try{
            const getPosts = await Post.find({"category":req.query.category, "expirationDate":{"$lt":Date.now()}})
            const postsJson = []

            for await (const post of getPosts) {
                postsJson.push(await appendPostData(post))
            }

            res.send(postsJson)
            return
        } catch(err){
            res.status(500)
            res.send({message:err})
            return
        }
    }
    try{
        const getPosts = await Post.find()
        const postsJson = []
        for (const post of getPosts) {
            postsJson.push( await appendPostData(post))
        }
        res.send(postsJson)
        return

    } catch(err){
        res.status(500)
        res.send({message:err})
        return
    }
})

// GET ->  Gets "hottest" message: one with the highest number of likes+dislikes
router.get('/hot', verifyToken ,async(req,res)=>{

    try{
        const getPosts = await Post.aggregate([
            {$addFields: {total: {$add: [{$size: '$likes'}, {$size: '$dislikes'}]}}},
            {$sort: { total: -1}},
            {$limit: 1},
        ])

        const hotPost = await Post.find({_id: getPosts[0]._id})

        const postsJson = []
        for (const post of hotPost) {

            postsJson.push( await appendPostData(post))
        }
        res.send(postsJson)
        return

    } catch(err){
        res.status(500)
        res.send({message:err})
        return
    }
})

// GET -> Gets message with given _id
router.get('/:postId',verifyToken, async(req,res) =>{
    try{
        const getPostById = await Post.findById(req.params.postId)
        const postJson = appendPostData(getPostById)
        res.send(postJson)
        return
    }catch(err){
        res.status(500)
        res.send({message:err})
        return
    }
})

// POST -> Posts a new comment (message) to given _id of parent message
router.post('/comment/:postId', verifyToken, async(req, res) => {
    // TODO:  check if post is not expired.
    const postCheck = await Post.findOne({_id:req.params.postId})
    if (postCheck.expirationDate<Date.now()){
        res.status(400).send({message:"Post expired."})
        return
    }
    const postData = new Post({
        title: req.body.title,
        category: postCheck.category,
        message: req.body.message,
        expirationTime: req.body.expirationTime, // In minutes
        postOwner: req.user._id,
        postParent: req.params.postId,
        // IDK why it is so wierd, probably there is an easier way to do it
        expirationDate: new Date(Date.now()).setMinutes(new Date(Date.now()).getMinutes()+
            (req.body.expirationTime?req.body.expirationTime:Post.schema.path('expirationTime').options.default))
    })
    try {
        const postToSave = await postData.save()
        res.send(postToSave)
        return
    } catch(err) {
        res.status(500)
        res.send({message: err})
        return
    }
})


// Patch -> Likes the post
// Not sure which one is more applicable - post or patch: on one hand - it is operation by another user,
// that "doesn't" modify original message, on the other hand technically it does modify it.

router.patch('/like/:postId', verifyToken, async(req, res) => {
    // TODO: Like, Check if user is not one posted, check if post is not expired.

    const postData = await Post.findOne({_id:req.params.postId})
    // Check that post exists
    if (!postData){
        res.status(400).send({message:"Post does not exist."})
        return
    }
    if(postData.postOwner == req.user._id){
        res.status(400).send({message:"User can not like own posts."})
        return
    }
    // Check that post is not liked
    if (postData.likes.includes(req.user._id)){
        res.status(400).send({message:"User already liked the post."})
        return
    }
    //Check that post did not expire
    if (postData.expirationDate<Date.now()){
        res.status(400).send({message:"Post expired."})
        return
    }
    // Liking disliked post only removes dislike.
    if (postData.dislikes.includes(req.user._id)){
        try {
            const updatePostById = await Post.updateOne(
                { _id: req.params.postId },
                { $pull: { dislikes: req.user._id } }//,
                // done
            )
            res.send(updatePostById)
            return
        } catch(err){
            res.status(500)
            res.send({message:err})
            return
        }
    }

    try {
        const updatePostById = await Post.updateOne(
            { _id: req.params.postId },
            { $push: { likes: req.user._id } }//,
            // done
        )
        res.send(updatePostById)
        return
    } catch(err){
        res.status(500)
        res.send({message:err})
        return
    }
})

// PATCH -> Same as like, but dislike
router.patch('/dislike/:postId', verifyToken, async(req, res) => {
    // TODO: Dislike
    const postData = await Post.findOne({_id:req.params.postId})
    if (!postData){
        res.status(400).send({message:"Post does not exist."})
        return
    }
    if(postData.postOwner == req.user._id){
        res.status(400).send({message:"User can not dislike own posts."})
        return
    }
    if (postData.dislikes.includes(req.user._id)){
        res.status(400).send({message:"User already disliked the post."})
        return
    }

    if (postData.expirationDate<Date.now()){
        res.status(400).send({message:"Post expired."})
        return
    }

    if (postData.likes.includes(req.user._id)){
        try {
            const updatePostById = await Post.updateOne(
                { _id: req.params.postId },
                { $pull: { likes: req.user._id } }//,
                // done
            )
            res.send(updatePostById)
            return
        } catch(err){
            res.status(400)
            res.send({message:err})
            return
        }
    }

    try {
        const updatePostById = await Post.updateOne(
            { _id: req.params.postId },
            { $push: { dislikes: req.user._id } }//,
            // done
        )
        res.send(updatePostById)
        return
    } catch(err){
        res.status(400)
        res.send({message:err})
        return
    }
})

module.exports = router
