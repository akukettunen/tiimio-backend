const { user } = require('../middleware/authMiddleware')
const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      user_db = require('../utils/db/user')
      team_db = require('../utils/db/team')
      stripe = require('../utils/stripe/index')
      userHelper = require('../utils/user/userHelper')
      nanoid = require('nanoid')
      emailService = require('../utils/aws/email')
      require('express-async-errors');

router.post('/login', async (req, res) => {
  let { password, email } = req.body
  let { currentTeamId } = req.query

  if(!email || !password) throw Error('bad request')

  // gets user data from db and hashes the password
  let [ user ] = await user_db.getUserByEmail(email)

  if(!user) throw Error('wrong password or email') 

  const result = await bcrypt.compare(password, user.password)

  if(!result) throw Error('wrong password or email')

  // lets not return the password to frontend
  delete user.password

  user = await userHelper.createUserData(currentTeamId, user)

  // creates a token with said data
  const token = jwt.sign(
    user,
    process.env.SECRET_KEY,
    { expiresIn: '1d' }
  )

  res.send({ token })
})

router.post('/signin', async (req, res) => {
  const { email, password, full_name, password_again, language } = req.body;
  if(password !== password_again) {
    throw new Error("passwords don't match, try again!")
  }

  if(!full_name.length) throw new Error("name missing!")
  
  const hash = await bcrypt.hash(password, saltRounds)
  if(!password || password.length < 8) throw new Error('invalid password')

  const [ oldUser ] = await user_db.getUserByEmail(email)
  
  if(oldUser) throw new Error("this user already exists!")

  await user_db.addUser({
    password_hash: hash,
    email,
    language,
    full_name
  })

  await emailService.sendWelcomeEmail(email)

  let [ user ] = await user_db.getUserByEmail(email)
  const teams = []
  
  const token = jwt.sign(
    { ...user, teams },
    process.env.SECRET_KEY,
    { expiresIn: '1d' }
  )
    
  res.json({ token })
})

router.get('/refresh', user, async (req, res) => {
  let { currentTeamId } = req.query
  let inUserCurrentTeamId = req.tiimio_user.currentTeamId 
  let { email } = req.tiimio_user
  let [ user ] = await user_db.getUserByEmail(email)

  delete user.password
  console.log(currentTeamId)
  console.log(inUserCurrentTeamId)
  user = await userHelper.createUserData(currentTeamId || inUserCurrentTeamId, user)

  const token = jwt.sign(
    user,
    process.env.SECRET_KEY,
    { expiresIn: '1d' }
  )

  res.send({ token })
})

router.post('/forgot-password/:email', async () =>  {
  const email = req.params.email
  const [ user ] = await user_db.getUserByEmail(email)

  if(!user) {
    // this is a security feature
    res.send(`link send to ${email}!`)
    return
  }

  const raw_token = nanoid(40)
  const hashed_token = await bcrypt.hash(raw_token, saltRounds)
  const expiry_unix_seconds = parseInt(Date.now() / 1000) + 60 * 60

  await user_db.addPasswordResetToken(email, hashed_token, expiry_unix_seconds)

  res.send(`link send to ${email}!`)
})

router.get('/forgot-password/:hash', () => {

})

module.exports = router;