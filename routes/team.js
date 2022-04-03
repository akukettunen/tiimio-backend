require('dotenv').config()
const express = require('express');
const { query } = require('../utils/db/index')
const { user } = require('../middleware/authMiddleware');
const { createCustomer } = require('../utils/stripe/index')
const db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      video_db = require('../utils/db/video')
      team_db = require('../utils/db/team')
      user_db = require('../utils/db/user')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      join_code = require('../utils/video/join_code')
      team_helper = require('../utils/team/teamHelper')
      initialValues = require('../utils/team/initialValues')
      userHelper = require('../utils/user/userHelper')
      require('express-async-errors');

router.post('/', user, async (req, res) => {
  const { team_name, sport_id } = req.body
  if(!team_name || !sport_id) throw new Error('bad request')

  const joinCode = await team_helper.generateJoinCode()

  const [{ planId }] = await query(`
    SELECT id AS planId 
    FROM plan 
    WHERE is_the_freemium = true;
  `)

  const { insertId } = await team_db.createTeam({
    sportId: sport_id,
    name: team_name,
    joinCode, 
    leagueId: undefined, 
    joinCode,
    planId
  })

  const stripeCustomer = await createCustomer({ 
    full_name: req.tiimio_user.name,
    email: req.tiimio_user.email,
    meta: {
      team_id: insertId,
      team_name: team_name
    }
  })

  await team_db.addUserToTeam({
    email: req.tiimio_user.email,
    team_id: insertId,
    orderer: true,
    stripe_id: stripeCustomer.id
  })

  const initial = initialValues[sport_id]()
  await time_db.batchAddTimename(insertId, initial['timenames'])

  const user = await userHelper.createUserData(insertId, req.tiimio_user)
  console.log(user)
  const token = jwt.sign(
    user,
    process.env.SECRET_KEY
  )

  res.json({ token })
})

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

  const user = await userHelper.createUserData(team.id, req.tiimio_user)

  const token = jwt.sign(
    user,
    process.env.SECRET_KEY
  )

  res.json({ 
    token, 
    team
  })
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
    { 
      ...user, 
      teams: new_teams
    },
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