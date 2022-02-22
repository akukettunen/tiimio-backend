require('dotenv').config()
const   express = require('express')
        app = express()
        cors = require('cors')
        bodyParser = require('body-parser')
        cookieParser = require('cookie-parser')
        // rateLimit = require("express-rate-limit")
        // limiter = rateLimit({ windowMs: 60 * 1000, max: 500, legacyHeaders: false })
        requestMethod = require('./middleware/requestMethod.js')
        errorMiddleware = require('./middleware/error.js')
        companion = require('./utils/uppy/index')
        session = require('express-session')
        user_middleware = require('./middleware/userMiddleware')

app.use(bodyParser.json())
app.use(cookieParser())
app.use(cors())
app.use(user_middleware)

// TODO: change secret
app.use(session({ secret: 'some secrety secret' }))

app.use('/companion', companion)

const auth = require('./routes/auth')
const plan = require('./routes/plan')
const video = require('./routes/video')
const stripe = require('./routes/stripe')
const team = require('./routes/team')
const clip = require('./routes/clip')
const tag = require('./routes/tag')
const folder = require('./routes/folder')

// rate limiter needs this for usage in heroku
app.set('trust proxy', 1);

// disables TRACK and TRACE methods for all endpoints
app.use(requestMethod)

app.use('/auth', auth)
app.use('/video', video)
app.use('/stripe', stripe)
app.use('/team', team)
app.use('/plan', plan)
app.use('/clip', clip)
app.use('/tag', tag)
app.use('/folder', folder)

// limits the amount of requests made from the same ip (500 / 1 min)
// app.use(limiter);

app.get('/', (req, res) => {
    res.send('<h1>Welcome to tiimi api!</h1>')
})

app.use(errorMiddleware)

var port = process.env.PORT || 4040;

app.listen(port, process.env.IP, function() {
    console.log("🚀 tiimi.io server started at port " + port + " 🚀")
});