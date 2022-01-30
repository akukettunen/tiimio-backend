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
      require('express-async-errors');

router.post('/login', async (req, res) => {
  let { password, email } = req.body

  if(!email || !password) throw Error('bad request')

  // gets user data from db and hashes the password
  let [ user ] = await user_db.getUserByEmail(email)

  if(!user) throw Error('wrong password or email') 

  const result = await bcrypt.compare(password, user.password)

  if(!result) throw Error('wrong password or email')

  // get users teams from db
  let teams = await team_db.userTeams(email)

  // parses the teams joincode away if the user isnt an admin
  teams = teams.map(team => {
    if(!team.team_admin) delete team.join_code
    return team
  })

  // lets not return the password to frontend
  delete user.password

  // combines the user and their team data
  user = { ...user, teams }

  // creates a token with said data
  const token = jwt.sign(
    { ...user, teams },
    process.env.SECRET_KEY,
    { expiresIn: '1d' }
  )

  // more straightforward to send the user data seperately
  // allthough the token contains that data too
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

module.exports = router;