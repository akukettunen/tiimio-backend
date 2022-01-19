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
      join_code = require('../utils/video/join_code')

router.post('/join', user, async (req, res) => {
  if(!req.body.join_code) throw new Error('no join code!')

  let [ team ] = await team_db.teamByJoinCode(req.body.join_code.toUpperCase())
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
    process.env.SECRET_KEY
  )

  res.json({ token, team })
})

router.get('/:id/users', user, async (req, res) => {
  let user = req.tiimio_user
  let team = user.teams.find(team => team.id == req.params.id)
  if(!team) throw new Error('invalid auth')

  let users = await team_db.teamUsers(team.id)

  res.json(users)
})

router.put('/:id/joincode', user, async (req, res) => {
  // TODO check admin
  let user = req.tiimio_user
  let code = join_code.generate(6)
  let team = user.teams.find(team => team.id == req.params.id)

  if(!team) throw new Error('invalid auth')

  await team_db.changeJoinCode(req.params.id, code)

  let new_teams = [ ...req.tiimio_user.teams ]
  let i = new_teams.findIndex(team => team.id == req.params.id)
  new_teams[i]['join_code'] = code

  const token = jwt.sign(
    { ...user, new_teams },
    process.env.SECRET_KEY
  )

  res.json({ code, token })
})

router.put('/:id/user/:email', user, async (req, res) => {
  // TODO check admin and params
  // TODO cant be team_owner whos changes

  await team_db.setAdminStatus(req.params.id, req.params.email, req.body.team_admin)

  res.json('admin status set!')
})

router.delete('/:id/user/:email', user, async (req, res) => {
  // TODO check admin/theirself and params existing
  // TODO cant be team_owner whos deleted

  let data = await team_db.deleteUserFromTeam(req.params.id, req.params.email)

  res.send('user deleted!')
})

module.exports = router;