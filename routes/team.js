require('dotenv').config()
const express = require('express');
const { user } = require('../middleware/authMiddleware')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcrypt');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      video_db = require('../utils/db/video')
      team_db = require('../utils/db/team')
      user_db = require('../utils/db/user')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);

router.post('/join', user, async (req, res) => {
  if(!req.body.join_code) throw new Error('no join code!')
  console.log(req.tiimio_user)

  let [ team ] = await team_db.teamByJoinCode(req.body.join_code)
  let teams = await team_db.userTeams(req.tiimio_user.email)

  if(!team) throw new Error('team not found :(')
  
  if(teams.find(tea => tea.id == team.id)) throw new Error(`you belong to ${team.team_name} already!`)  

  await team_db.addUserToTeam({
    email: req.tiimio_user.email,
    team_id: team.id
  })

  let user = req.tiimio_user
  user['teams'] = teams.concat(team)

  const token = jwt.sign(
    user,
    process.env.SECRET_KEY,
    // { expiresIn: '1d' }
  )

  res.json({ token })
})

module.exports = router;