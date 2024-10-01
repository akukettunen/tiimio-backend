const express = require('express');
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      league_db = require('../../utils/db/league')
      season_db = require('../../utils/db/season')
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

  let clubPromises = leagues.map(l => {
    return league_db.leagueClubs(l.id)
  })

  let clubs = await Promise.all(clubPromises)
  clubs = clubs.flat()
  
  leagues = leagues.map(l => {
    return {...l, clubs: clubs.filter(t => t.league_id == l.id)}
  })

  res.json(leagues)
})

router.patch('/:id', tiimi_admin, async (req, res) => {
  const { id } = req.params;
  const { archived, league_name } = req.body;

  let updates = {}

  if(typeof archived !== 'undefined') updates.archived = archived
  if(league_name) updates.league_name = league_name

  const [ league ] = await league_db.getLeague(id)
  if(!league) throw new Error('league not found')

  await league_db.updateLeague(id, updates)

  res.send({ ...league, ...updates })
})

router.get('/:id/club', user, async (req, res) => {
  const { id } = req.params

  const clubs = await league_db.leagueClubs(id)

  res.json(clubs)
})

router.get('/:id/seasons', user, async (req, res) => {
  const { id } = req.params

  const seasons = await season_db.leagueSeasons(id)

  res.json(seasons)
})

router.post('/:id/club', tiimi_admin, async (req, res) => {
  const { id } = req.params
  const { logo_url, small_logo_url, club_name, club_name_short } = req.body;

  const response = await league_db.addLeagueClub({ 
    league_id: id,
    logo_url, 
    small_logo_url, 
    club_name, 
    club_name_short 
  })

  const [club] = await league_db.clubById(response.insertId)

  res.json( club )
})

router.patch('/club/:id', tiimi_admin, async (req, res) => {
  const { id } = req.params;
  const { logo_url, small_logo_url, club_name, club_name_short } = req.body;

  let updates = {}
  if(logo_url) updates.logo_url = logo_url
  if(small_logo_url) updates.small_logo_url = small_logo_url
  if(club_name) updates.club_name = club_name
  if(club_name_short) updates.club_name_short = club_name_short

  const response = await league_db.updateClub(id, updates)

  if(response.affectedRows === 0) throw new Error('club not found')

  const [ new_club ] = await league_db.clubById(id)
  res.json({ ...new_club, ...updates })
})

router.get('/:id/game', user, async (req, res) => {
  const { id } = req.params
  const { season } = req.query

  const games = await league_db.leagueGames(id, season)

  res.json(games)
})

router.get('/game/:id', user, async (req, res) => {
  const { id } = req.params
  const [game] = await league_db.getLeagueGameById(id)
  if(!game) throw new Error('video not found')
  let clips = await clip_db.gameClips(game.id, req.tiimio_user?.currentTeamId)
  let times = await timeHelper.videoTimes(game.id)
  let mapped_times = times.map(t => {
    let parsed = JSON.parse(t.tags)
    return {
      ...t,
      tags: parsed[0]?.id ? parsed : []
    }
  })

  let mapped_clips = clips.map(t => {
    let parsed_tags = JSON.parse(t.tags)
    let parsed_points = JSON.parse(t.points)
    return {
      ...t,
      tags: parsed_tags[0]?.id ? parsed_tags : [],
      points: parsed_points[0]?.id ? parsed_points : []
    }
  })

  res.json( { ...game, clips: mapped_clips, times: mapped_times } )
})

router.put('/game/:id', tiimi_admin, async (req, res) => {
  await league_db.putLeagueGame(req.body)

  let [ game ] = await league_db.getLeagueGameById(req.params.id)

  res.json(game)
})

router.delete('/game/:id', tiimi_admin, async (req, res) => {
  await league_db.deleteGame(req.params.id)

  res.json('ok!')
})

router.get('/:id/teams', tiimi_admin, async (req, res) => {
  let teams = await league_db.leagueTeams(req.params.id)
  res.json(teams)
})

router.post('/team', tiimi_admin, async (req, res) => {
  const { league_id, team_name, logo_url } = req.body
  if(!team_name || !league_id) throw new Error('bad request')

  const insertData = await league_db.addClubToLeague([league_id, team_name, logo_url])
  const team = await league_db.leagueByTeamId(insertData.insertId)

  res.json(team)
})

router.post('/:id/game', user, async (req, res) => {
  const insertData = await league_db.addGameToLeague(req.body)

  const [ addedGame ] = await league_db.getLeagueGameById(insertData.insertId)

  res.json(addedGame)
})

router.delete('/team/:id', tiimi_admin, async (req, res) => {
  await league_db.deleteLeagueTeamById(req.params.id)
  res.send('ok!')
}) 

module.exports = router;