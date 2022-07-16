require('dotenv').config()
const   express = require('express')
const { comp, instance } = require('./utils/uppy/index')
        app = express()
        cors = require('cors')
        bodyParser = require('body-parser')
        cookieParser = require('cookie-parser')
        // rateLimit = require("express-rate-limit")
        // limiter = rateLimit({ windowMs: 60 * 1000, max: 500, legacyHeaders: false })
        requestMethod = require('./middleware/requestMethod.js')
        errorMiddleware = require('./middleware/error.js')
        session = require('express-session')
        user_middleware = require('./middleware/userMiddleware')

const corsOptions = {
    origin: '*',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    optionsSuccessStatus: 200
}
// TODO: change secret
app.use(session({ secret: 'some secrety secret' }))

app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(user_middleware)


app.options('*', cors(corsOptions));
app.use('/companion', comp)

const auth = require('./routes/auth')
const maps = require('./routes/maps')
const admin = require('./routes/admin')
const sport = require('./routes/sport')
const plan = require('./routes/plan')
const video = require('./routes/video')
const stripe = require('./routes/stripe')
const team = require('./routes/team')
const clip = require('./routes/clip')
const tag = require('./routes/tag')
const folder = require('./routes/folder')
const time = require('./routes/time')
const filter = require('./routes/filter')
const rule = require('./routes/rule')
const league = require('./routes/admin/league')

// rate limiter needs this for usage in heroku
app.set('trust proxy', 1);

// disables TRACK and TRACE methods for all endpoints
app.use(requestMethod)

app.use('/auth', auth)
app.use('/admin', admin)
app.use('/sport', sport)
app.use('/video', video)
app.use('/stripe', stripe)
app.use('/team', team)
app.use('/plan', plan)
app.use('/clip', clip)
app.use('/tag', tag)
app.use('/folder', folder)
app.use('/time', time)
app.use('/filter', filter)
app.use('/rule', rule)
app.use('/maps', maps)
app.use('/league', league)

// limits the amount of requests made from the same ip (500 / 1 min)
// app.use(limiter);

app.get('/', (req, res) => {
    res.send('<h1>Welcome to tiimi api!</h1>')
})

app.use(errorMiddleware)

var port = process.env.PORT || 4040;

const server = app.listen(port, process.env.IP, function() {
    console.log("🚀 tiimi.io server started at port " + port + " 🚀")
});

instance.socket(server)
