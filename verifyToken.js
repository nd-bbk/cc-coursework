const { send } = require("express/lib/response")
const jsonwebtoken = require("jsonwebtoken")

function auth(req,res,next){
    const token = req.header('auth-token')
    if(!token) {res.status(401).send({message:"Access denied."})}
    try{
        const verified = jsonwebtoken.verify(token, process.env.TOKEN_SECRET)
        req.user = verified
        //console.log(req.user)
        //console.log(verified)
        next()
    } catch(err){
        res.status(401).send({message:"Invalid Token"})
        return
    }
}

module.exports = auth