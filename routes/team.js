require('dotenv').config()
const express = require('express');
const { query } = require('../utils/db/index')
const { user, is_in_team } = require('../middleware/authMiddleware');
const { createCustomer } = require('../utils/stripe/index')
const { initTeamHotkeys } = require('../utils/hotkey/initTeamHotkeys')
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
  let { team_name, sport_id, dont_add_user, plan_id, initial_admin, league_id } = req.body

  const admin = req.tiimio_user.tiimio_admin

  if(!team_name || !sport_id) throw new Error('bad request')
  league_id = admin ? league_id : undefined

  const joinCode = await team_helper.generateJoinCode()

  let initial
  const initialFunc = initialValues[sport_id]
  if(!initialFunc) initial = { timenames: ['Start', 'End'] }
  else initial = initialFunc()

  const planId = plan_id ? plan_id : 1;

  const { insertId } = await team_db.createTeam({
    sportId: sport_id,
    name: team_name,
    joinCode,
    leagueId: league_id,
    joinCode,
    planId,
    initialAdmin: initial_admin
  })

  if(!dont_add_user) {
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
  }


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

  // Init action hotkeys (like toggle map etc.)
  try {
    await initTeamHotkeys( insertId )
  } catch(e) {
    throw new Error(e)
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

  let isInitialAdmin;

  if(!team.initial_admin) isInitialAdmin = false;
  else {
    admins = team.initial_admin.split(',')
    const isAdmin = admins.map(a => a.trim()).includes(req.tiimio_user.email)
    isInitialAdmin = isAdmin
  }

  await team_db.addUserToTeam({
    email: req.tiimio_user.email,
    team_id: team.id,
    admin: isInitialAdmin
  })

  // this is a workaround
  const [ added_to_team ] = await team_db.teamById(team.id)
  teams = teams.concat({ team_admin: isInitialAdmin, ...added_to_team })

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
  const [ team ] = await team_db.teamById(req.params.team_id)
  let [ current_users ] = await team_db.teamUserAmount(req.params.team_id)
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
  if(!team || !team.team_admin) throw new Error('invalid auth')

  let users = await team_db.teamUsers(team.id)

  res.json(users)
})

router.put('/:id/joincode', user, async (req, res) => {
  let user = req.tiimio_user
  let team = user.teams.find(team => team.id == req.params.id)
  if(!team || !team.team_admin) throw new Error('invalid auth')

  const code = await team_helper.generateJoinCode()

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
  let user = req.tiimio_user
  let team = user.teams.find(team => team.id == req.params.id)
  if(!team || !team.team_admin) throw new Error('invalid auth')

  await team_db.setAdminStatus(req.params.id, req.params.email, req.body.team_admin)

  res.json('admin status set!')
})

router.delete('/:id/user/:email', user, async (req, res) => {
  let user = req.tiimio_user
  let team = user.teams.find(team => team.id == req.params.id)
  if(!team || !team.team_admin) throw new Error('invalid auth')

  const [ user_team ] = await user_db.getUserTeam(req.params.email, req.params.id)

  if(!user_team || user_team.team_orderer) throw new Error('auth error')

  await team_db.deleteUserFromTeam(req.params.id, req.params.email)

  res.send('user deleted!')
})

// router.delete('/userteam/:team_id/user/:email', user, is_in_team(), async (req, res) => {
//   const { team_id, email } = req.params;

//   await team_db.deleteUserTeam(email, team_id)

//   const user = await userHelper.createUserData(team_id, req.tiimio_user)

//   const token = jwt.sign(
//     user,
//     process.env.SECRET_KEY
//   )

//   res.json({ token })
// })

module.exports = router;