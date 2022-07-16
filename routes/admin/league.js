const express = require('express');
const { kill } = require('ngrok');
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      league_db = require('../../utils/db/league')
      require('express-async-errors');
      const { user, is_in_team, tiimi_admin } = require('../../middleware/authMiddleware');

router.get('/', user, async (req, res) => {
  let leagues;
  if(req.tiimio_user.tiimio_admin) {
    // return all leagues
    leagues = await league_db.getLeagues()
  } else {
    leagues = await league_db.leagueWhereAdmin(req.tiimio_user.email)
  }

  let teamPromises = leagues.map(l => {
    return league_db.leagueTeams(l.id)
  })

  let teams = await Promise.all(teamPromises)
  teams = teams.flat()
  
  leagues = leagues.map(l => {
    return {...l, teams: teams.filter(t => t.league_id == l.id)}
  })

  res.json(leagues)
})

router.get('/:id/team', user, async (req, res) => {
  const { id } = req.params

  const teams = await league_db.leagueTeams(id)

  res.json(teams)
})

router.get('/:id/game', user, async (req, res) => {
  const { id } = req.params

  const games = await league_db.leagueGames(id)

  res.json(games)
})

router.get('/game/:id', user, async (req, res) => {
  const { id } = req.params

  const [game] = await league_db.getLeagueGameById(id)

  res.json(game)
})

router.put('/game/:id', user, async (req, res) => {
  await league_db.putLeagueGame(req.body)

  let [ game ] = await league_db.getLeagueGameById(req.params.id)

  res.json(game)
})

router.post('/team', tiimi_admin, async (req, res) => {
  const { league_id, team_name, logo_url } = req.body
  if(!team_name || !league_id) throw new Error('bad request')

  const insertData = await league_db.addTeamToLeague([league_id, team_name, logo_url])
  const team = await league_db.leagueByTeamId(insertData.insertId)

  res.json(team)
})

router.post('/game', user, async (req, res) => {
  const insertData = await league_db.addGameToLeague(req.body)

  const [addedGame] = await league_db.getLeagueGameById(insertData.insertId)

  res.json(addedGame)
})

router.delete('/team/:id', tiimi_admin, async (req, res) => {
  await league_db.deleteLeagueTeamById(req.params.id)
  res.send('ok!')
}) 

module.exports = router;