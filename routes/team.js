require('dotenv').config()
const express = require('express');
const { query } = require('../utils/db/index')
const { user, is_in_team } = require('../middleware/authMiddleware');
const { createCustomer } = require('../utils/stripe/index')
const db = require('../utils/db/index');
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
      template_helper = require('../utils/template/templateHelper')
      email = require('../utils/aws/email')
      initialValues = require('../utils/team/initialValues')
      userHelper = require('../utils/user/userHelper')
      video_helper = require('../utils/video/videoHelper')
      require('express-async-errors');
      mail = require('../utils/email/mailchimp')
      
const { v4: uuidv4 } = require('uuid');
const { default: videoHelper } = require('../utils/video/videoHelper');

router.post('/', user, async (req, res) => {
  const { team_name, sport_id } = req.body
  if(!team_name || !sport_id) throw new Error('bad request')

  const joinCode = await team_helper.generateJoinCode()

  const initial = initialValues[sport_id]()

  // const [{ planId }] = await query(`
  //   SELECT id AS planId 
  //   FROM plan
  //   WHERE is_the_freemium = true;
  // `)

  const planId = 1;

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
    admin: true,
    orderer: true,
    stripe_id: stripeCustomer.id
  })

  await email.sendAkuAnEmail()

  try {
    await time_db.batchAddTimename(insertId, initial['timenames'])
  } catch(err) {
    throw new Error(err)
  }

  try {
    await team_helper.addInitialTags(insertId, sport_id)
  } catch(err) {
    throw new Error(err)
  }

  // try {
  //   await video_helper.addSampleVideo(insertId)
  // } catch(e) {
  //   throw new Error(e)
  // }

  try {
    await template_helper.copySportTemplatesToTeam(sport_id, insertId)
  } catch(e) {
    throw new Error(e)
  }

  // Add team owner tag to user
  await mail.addTagToUser(req.tiimio_user.email, ['Team owner - Free', sport_id])

  const user = await userHelper.createUserData(insertId, req.tiimio_user)

  const token = jwt.sign(
    user,
    process.env.SECRET_KEY
  )

  res.json({ token })
})

router.post('/join', user, async (req, res) => {
  const { join_code, invite_code } = req.body
  if(!join_code && !invite_code) throw new Error('no join code!')

  let team;
  if(join_code) [ team ] = await team_db.teamByJoinCode(join_code.toUpperCase())
  else [ team ] = await team_db.teamByInviteCode(invite_code.toLowerCase())

  
  // get all user teams
  let teams = await team_db.userTeams(req.tiimio_user.email)

  if(!team) throw new Error('team not found :(')
  if(teams.find(t => t.id == team.id)) throw new Error(`You belong to ${team.team_name} already!`)  
  
  const [{ number_of_users }] = await team_db.numOfUsersInTeam(team.id)

  if(number_of_users >= team.users) throw new Error('Teams user limit reached :/')
  
  const isInitialAdmin = team.initial_admin == req.tiimio_user.email

  await team_db.addUserToTeam({
    email: req.tiimio_user.email,
    team_id: team.id,
    admin: isInitialAdmin
  })

  // this is a workaround
  const [ added_to_team ] = await team_db.teamById(team.id)
  teams = teams.concat(added_to_team)

  // Add team joiner and sport_id tags to user
  await mail.addTagToUser(req.tiimio_user.email, ['Joined team', team.sport_id])

  const user = await userHelper.createUserData(team.id, req.tiimio_user, teams)

  const token = jwt.sign(
    user,
    process.env.SECRET_KEY
  )

  if(invite_code) await team_db.deleteInvite( team.id,  req.tiimio_user.email)

  res.json({ 
    token, 
    team
  })
})

router.post('/:team_id/invite', user, is_in_team(), async (req, res) => {
  const [team] = await team_db.teamById(req.params.team_id)
  let [current_users] = await team_db.teamUserAmount(req.params.team_id)
  current_users = current_users?.amount || 0
  const allowed_users = team?.users || 0

  const invitable_amount = allowed_users - current_users

  const { emails } = req.body

  // check that there are emails actually
  if(!emails || !emails.length) throw new Error('No emails')
  // check that theres room for them
  if(invitable_amount <= 0 || invitable_amount < emails.length) throw new Error('Team full!')

  // validate the emails
  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  emails.forEach(email => {
    if(!email.match(mailformat)) throw new Error(`Invalid email included: ${email}`)
  })

  const values = emails.map(e => {
    return [
      e,
      team.id,
      uuidv4()
    ]
  })

  await team_db.addInvites(values)

  let proms = values.map(v => {
    return email.invite_to_team_email(v[0], v[2])
  })

  await Promise.all(proms)

  let invites = await team_db.teamInvites(req.params.team_id)

  res.json(invites)
  // todo invite people
})

router.get('/:team_id/invite', user, is_in_team(), async (req, res) => {
  const invites = await team_db.teamInvites(req.params.team_id)

  res.json(invites)
})

router.delete('/:team_id/invite/:email', user, is_in_team(), async (req, res) => {
  await team_db.deleteInvite(req.params.team_id, req.params.email)

  res.json('ok!')
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
  const code = await team_helper.generateJoinCode()
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

router.delete('/userteam/:team_id/user/:email', user, async (req, res) => {
  is_in_team()

  const { team_id, email } = req.params;

  await team_db.deleteUserTeam(email, team_id)

  const user = await userHelper.createUserData(team_id, req.tiimio_user)

  const token = jwt.sign(
    user,
    process.env.SECRET_KEY
  )

  res.json({ token })
})

module.exports = router;