const { query } = require('./index.js')

const getLeagues = () => {
  return query(`
    SELECT * FROM league;
  `)
}

const leagueTeams = id => {
  return query(`
    SELECT * FROM league_team
    WHERE league_id = ?;
  `, [id])
}

const leagueGames = id => {
  return query(`
    SELECT 
      *, 
      league_game.id id,
      home_team.logo_url home_team_logo_url, 
      away_team.logo_url away_team_logo_url,
      home_team.team_name home_team_name,
      away_team.team_name away_team_name,
      away_team.short_name away_team_short_name,
      home_team.short_name home_team_short_name
    FROM league_game
    LEFT JOIN league_team as home_team ON home_team.id = league_game.home_team_id
    LEFT JOIN league_team as away_team ON away_team.id = league_game.away_team_id
    WHERE league_game.league_id = ?
    ORDER BY starttime_unix DESC;
  `, [id])
}

const putLeagueGame = game => {
  let { id, home_team_id, away_team_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type } = game
  return query(`
    UPDATE league_game
    SET home_team_id=?, away_team_id=?, score_home=?,
    score_away=?, starttime_unix=?, publishtime_unix=?, 
    analyzed=?, will_be_analyzed=?, video_url=?, video_type=?
    WHERE id = ?;
  `, [ home_team_id, away_team_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type, id ])
}

const leagueWhereAdmin = email => {
  return query(`
    SELECT * FROM league
    RIGHT JOIN team ON team.league_id = league.id
    RIGHT JOIN user_team ON user_team.team_id = team.id
    WHERE user_team.email = ? AND user_team.league_id = 1
    GROUP BY league;
  `, [email])
}

const addTeamToLeague = team => {
  return query(`
    INSERT INTO league_team (league_id, team_name, logo_url)
    VALUES ?;
  `, team)
}

const addGameToLeague = game => {
  let { league_id, home_team_id, away_team_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type } = game
  analyzed = false

  return query(`
    INSERT INTO league_game (league_id, home_team_id, away_team_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [ league_id, home_team_id, away_team_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type ])
}

const getLeagueGameById = id => {
  return query(`
    SELECT 
      *, 
      home_team.logo_url home_team_logo_url, 
      away_team.logo_url away_team_logo_url,
      home_team.team_name home_team_name,
      away_team.team_name away_team_name,
      away_team.short_name away_team_short_name,
      home_team.short_name home_team_short_name
    FROM league_game
    LEFT JOIN league_team as home_team ON home_team.id = league_game.home_team_id
    LEFT JOIN league_team as away_team ON away_team.id = league_game.away_team_id
    WHERE league_game.id = ?;
  `, [id])
}

const leagueTeamById = id => {
  return query(`
    SELECT * FROM league_team
    WHERE id = ?;
  `, [id])
}

const deleteLeagueTeamById = id => {
  return query(`
    DELETE FROM league_team
    WHERE id = ?;
  `, [id])
}

module.exports = { 
  getLeagues, 
  leagueWhereAdmin, 
  addTeamToLeague, 
  leagueTeamById,
  deleteLeagueTeamById,
  leagueTeams,
  addGameToLeague,
  getLeagueGameById,
  leagueGames,
  putLeagueGame
}
