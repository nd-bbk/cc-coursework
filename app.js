const express = require('express')
const app = express()

const mongoose = require('mongoose')
const bodyParser = require('body-parser')

require('dotenv/config')

app.use(bodyParser.json())

const filmRoute = require('./routes/message')
const authRoute = require('./routes/auth')
//const browseRoute = require('./routes/browse')

app.use('/api/message', filmRoute)
app.use('/api/authRoute', authRoute)
//app.use('/api/browse', browseRoute)

MURL = process.env.DB_CONNECTOR
mongoose.connect(MURL)
    .then(() => console.log("DB connected"))
    .catch((err) => {console.error(err);});

app.listen(3000, ()=> {
    console.log("App is live...")
})