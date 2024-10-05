const express = require('express');
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      league_db = require('../../utils/db/league')
      player_db = require('../../utils/db/player')
      season_db = require('../../utils/db/season')
      require('express-async-errors');
const { user, is_in_team, tiimi_admin } = require('../../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

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
  const { archived, league_name, configuration } = req.body;

  let updates = {}

  if(typeof archived !== 'undefined') updates.archived = archived
  if(configuration && typeof configuration === 'object') updates.configuration = JSON.stringify(configuration)
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
  const [ game ] = await league_db.getLeagueGameById(id)
  if(!game) throw new Error('video not found')

  const current_team = req.tiimio_user.teams.find(t => t.id == req.tiimio_user?.currentTeamId)
  if(current_team.league_id !== game.league_id && !req.tiimio_user.tiimio_admin) throw new Error('game not in current league')

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

router.post('/:id/game', tiimi_admin, async (req, res) => {
  const id = uuidv4()
  await league_db.addGameToLeague({ id, ...req.body })

  const [ addedGame ] = await league_db.getLeagueGameById(id)

  res.json(addedGame)
})

router.delete('/team/:id', tiimi_admin, async (req, res) => {
  await league_db.deleteLeagueTeamById(req.params.id)
  res.send('ok!')
})

router.get('/game/:league_game_id/game-player', tiimi_admin, async (req, res) => {
  const { league_game_id } = req.params;
  
  const players = await player_db.getGamePlayers(league_game_id)

  res.json(players)
})

router.post('/:league_id/game/:league_game_id/game-player/batch', tiimi_admin, async (req, res) => {
  const { league_id, league_game_id } = req.params;
  const { game_players } = req.body;
  
  const getPromises = game_players.map(player => {
    return player_db.getPlayerByName( player.player_name )
  })

  const results = await Promise.all(getPromises)
  const saveFoundGamePlayers = results.flat()
  const foundPlayers = saveFoundGamePlayers.map(result => result.player_name);

  // Find the players that were not found by comparing with game_players
  const toBeSaved = game_players.filter(player => !foundPlayers.includes(player.player_name));

  const savePromises = toBeSaved.map(p => {
    return player_db.createPlayer({ 
      league_id, 
      league_club_id: p.league_club_id, 
      picture_url: p.picture_url, 
      external_service_id: p.external_service_id, 
      player_name: p.player_name
    })
  })
  await Promise.all(savePromises)
  const getNewPromises = toBeSaved.map(player => {
    return player_db.getPlayerByName( player.player_name )
  })
  const new_results = await Promise.all(getNewPromises)
  const saveNewlyAddedPlayers = new_results.flat()

  await player_db.deleteGamePlayers(league_game_id)

  const allGamePlayers = saveNewlyAddedPlayers.concat(saveFoundGamePlayers)
  const playersWithIds = game_players.map(p => {
    return {
      ...p,
      id: allGamePlayers.find(p2 => p2.player_name === p.player_name)?.id
    }
  })

  const gamePlayerSavePromises = playersWithIds.map(pla => {
    return player_db.createGamePlayer({
      player_id: pla.id,
      league_game_id,
      league_club_id: pla.league_club_id,
      num: pla.num,
      pos: pla.pos
    })
  })

  await Promise.all(gamePlayerSavePromises)
  const players = await player_db.getGamePlayers(league_game_id)

  res.json({ game_players: players, added_players: saveNewlyAddedPlayers })
  /*
    1. tsekkaa onko kukin pelaaja olemassa player-tablessa (nimen mukaan)
    2. ne, jotka ei, tallenna player-tableen
    3. ne, jotka on, hae heidän data
    4. tallenna game_player tableen
    5. lähetä takaisin joined queryn tulos kaikista pelin pelaajista
  */
})

router.get('/:id/player', tiimi_admin, async (req, res) => {
  const players = await player_db.leaguePlayers(req.params.id)
  res.json(players)
})

module.exports = router;