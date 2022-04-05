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
  const { email, password, full_name, password_again } = req.body;
  if(password !== password_again) {
    throw new Error("passwords don't match, try again!")
  }

  if(!full_name.length) throw new Error("name missing!")

  const hash = await bcrypt.hash(password, saltRounds)

  const isAlready = await user_db.getUserByEmail(email)
  
  if(isAlready.length) throw new Error("this user already exists!")

  await user_db.addUser({
    password_hash: hash,
    email,
    full_name
  })

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

module.exports = router;