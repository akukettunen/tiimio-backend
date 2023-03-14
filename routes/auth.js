const { user } = require('../middleware/authMiddleware')
const { nanoid } = require('nanoid')
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
      emailService = require('../utils/aws/email')
      crypto = require('crypto')
      require('express-async-errors');
      mail = require('../utils/email/mailchimp')

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

router.post('/divaridemo/login', async (req, res) => {
  let [ user ] = await user_db.getUserByEmail('divaridemo')

  user = await userHelper.createUserData(16, user)

  // creates a token with said data
  const token = jwt.sign(
    user,
    process.env.SECRET_KEY,
    { expiresIn: '1d' }
  )

  res.send({ token })
})

router.post('/demo/login', async (req, res) => {
  let [ user ] = await user_db.getUserByEmail('demo')

  user = await userHelper.createUserData(13, user)

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
  const name_split = full_name.split(' ')
  const first_name = name_split[0]
  const last_name = name_split[name_split.length - 1]
  
  const hash = await bcrypt.hash(password, saltRounds)
  if(!password || password.length < 8) throw new Error('invalid password')

  const [ oldUser ] = await user_db.getUserByEmail(email)
  
  if(oldUser) throw new Error("this user already exists!")

  const email_conf_string = nanoid(8)
  await user_db.addUser({
    password_hash: hash,
    email,
    language,
    full_name,
    email_confirmation_string: email_conf_string
  })

  // Add user to mailchimp list with user tag
  let tags = []
  if(process.env.ENVIRONMENT == 'dev') tags = ['Development', 'User']
  else tags = ['User']

  await mail.addUserToAudience(email, first_name, last_name, tags)

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
  user = await userHelper.createUserData(currentTeamId || inUserCurrentTeamId, user)

  const token = jwt.sign(
    user,
    process.env.SECRET_KEY,
    { expiresIn: '1d' }
  )

  res.send({ token })
})

router.post('/confirm-email', async (req, res) => {
  const { code } = req.body

  if(!code) throw new Error('bad request')

  const [ user ] = await user_db.userByConfirmationCode(code)

  if(!user) throw new Error('Invalid link :/')

  await user_db.confirmEmail(user.email)

  delete user.password
  const userData = await userHelper.createUserData(undefined, user)

  const token = jwt.sign(
    userData,
    process.env.SECRET_KEY,
    { expiresIn: '1d' }
  )

  res.send({ token })
})

router.post('/forgot-password/:email', async (req, res) =>  {
  const email = req.params.email
  const [ user ] = await user_db.getUserByEmail(email)

  if(!user) {
    // this is a security feature
    res.send(`link sent to ${email}!`)
    return
  }

  const raw_token = nanoid(40)
  const hashed_token = crypto.createHash('sha256').update(raw_token).digest('base64');
  const expiry_unix_seconds = parseInt(Date.now() / 1000) + 60 * 60
  const link = process.env.FRONTEND_BASE_URL + '/#/reset/' + raw_token
  await user_db.addPasswordResetToken(email, hashed_token, expiry_unix_seconds)
  await emailService.sendRefreshEmail(email, link, 60, expiry_unix_seconds * 1000)

  res.send(`link sent to ${email}!`)
})

router.post('/change-password/code', async (req, res) => {
  const { passwrd, passwrd_again, token } = req.body
  console.log(req.body)
  if(!passwrd || !passwrd_again || !token) throw new Error('bad request')
  if(!passwrd || passwrd.length < 8) throw new Error('invalid password')
  if(passwrd !== passwrd_again) throw new Error("passwords don't match, try again!")
  const hashed_token = crypto.createHash('sha256').update(token).digest('base64');

  // get reset token and email out of it
  const [ reset_token ] = await user_db.resetTokenByHash(hashed_token)

  if(!reset_token || !reset_token.user_id) throw new Error('Invalid link :(')
  const { user_id } = reset_token
  const email = user_id

  // create hash and refresh user password
  const hash = await bcrypt.hash(passwrd, saltRounds)
  await user_db.setNewPassword(email, hash)

  // delete all users password-refresh-tokens
  await user_db.deleteAllResetTokensByEmail(email)
  
  // create user token and send it to frontend
  let [ user ] = await user_db.getUserByEmail(email)
  // lets not return the password to frontend
  delete user.password

  // create user data
  user = await userHelper.createUserData(0, user)

  // creates a token with said data
  const user_token = jwt.sign(
    user,
    process.env.SECRET_KEY,
    { expiresIn: '1d' }
  )

  res.send({ token: user_token })
})

module.exports = router;