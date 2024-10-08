const { tiimi_admin } = require('../middleware/authMiddleware')
const express = require('express')
const { json } = require('body-parser')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      sport_db = require('../utils/db/sport')
      user_db = require('../utils/db/user')
      team_db = require('../utils/db/team')
      stripe = require('../utils/stripe/index')
      userHelper = require('../utils/user/userHelper')
      emailService = require('../utils/aws/email')
      crypto = require('crypto')
      require('express-async-errors');

router.get('/teams', tiimi_admin, async (req, res) => {
  const { index, limit } = req.query

  const teams = await team_db.allTeams(Number(index || 0), Number(limit || 10))

  res.json(teams)
})

router.get('/sports', tiimi_admin, async (req, res) => {
  const sports = await sport_db.allSports()

  res.json(sports)
})

router.get('/team/:id/users', tiimi_admin, async (req, res) => {
  const { id } = req.params;
  const users = await team_db.teamUsers(id)
  res.json(users)
})

router.patch('/team/:team_id/user/:user_id', tiimi_admin, async (req, res) => {
  const { team_id, user_id } = req.params;
  const { team_admin } = req.body;

  let updates = {}

  if(typeof team_admin !== 'undefined') updates.team_admin = team_admin

  const [ user ] = await user_db.getUserByEmail(user_id)
  delete user.password
  const [ user_team ] = await user_db.getUserTeam(user_id, team_id)
  if(!user_team) throw new Error('user_team not found')

  await user_db.updateUserTeam(team_id, user_id, updates)

  res.send({ ...user, ...user_team, ...updates })
})

router.delete('/team/:team_id/user/:user_id', tiimi_admin, async (req, res) => {
  // DELETE A USER FROM TEAM
  const { team_id, user_id } = req.params;

  await user_db.deleteUserTeam(user_id, team_id)

  res.json('ok')
})

router.patch('/player/:id', tiimi_admin, async (req, res) => {
  const { league_club_id } = req.body;
  const { id } = req.params;
  let updates = {}

  if(league_club_id) updates['league_club_id'] = league_club_id

  const [ player ] = await player_db.getPlayerById(id)
  await player_db.updatePlayer(player.id, updates)

  const re = { ...player, ...updates }

  res.json(re)
})

router.get('/player-check', tiimi_admin, async (req, res) => {
  const { player_name } = req.query;
  const [ result ] = await player_db.checkPlayerByName(player_name)
  res.json({ found: !!result })
})

module.exports = router;