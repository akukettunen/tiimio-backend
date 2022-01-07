const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
    // jwt = require('../middleware/auth.js')
    // logger = require('../utils/logger')
    // sendEmail = require('../utils/email')
    // mail = require('../utils/mail')
      bcrypt = require('bcrypt');
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
  res.send({ user, token })
})

router.post('/signin', (req, res) => {
  const { email, password, full_name, password_again } = req.body;
  if(password !== password_again) {
    // handle
  }

  // const { id } = await stripe.createCustomer({ full_name: 'Aku Kettunen', email: 'aku@kettunen.com' })
})

router.post('/signin', (req, res) => {
  
})

module.exports = router;