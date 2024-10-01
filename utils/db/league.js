const { query } = require('./index.js')

const getLeagues = () => {
  return query(`
    SELECT * FROM league;
  `)
}

const getLeague = (id) => {
  return query(`
    SELECT * FROM league
    WHERE id = ?;
  `, [id])
}

const updateClub = (id, updates) => {
  let fields = [];
  let values = [];

  for (const field in updates) {
    fields.push(`${ field } = ?`);
    values.push(updates[ field ]);
  }
  
  values.push(id);

  const q = `
    UPDATE league_club
    SET ${fields.join(', ')}
    WHERE id = ?;
  `

  return query(q, values)
}

const updateLeague = (id, updates) => {
  let fields = [];
  let values = [];

  for (const field in updates) {
    fields.push(`${ field } = ?`);
    values.push(updates[ field ]);
  }
  
  values.push(id);

  const q = `
    UPDATE league
    SET ${fields.join(', ')}
    WHERE id = ?;
  `

  return query(q, values)
}

const leagueClubs = id => {
  return query(`
    SELECT * FROM league_club
    WHERE league_id = ?
    ORDER BY club_name;
  `, [id])
}

const addLeagueClub = ({ league_id, logo_url, small_logo_url, club_name, club_name_short }) => {
  return query(`
    INSERT INTO league_club ( league_id, club_name, club_name_short, logo_url, small_logo_url )
    VALUES ( ?, ?, ?, ?, ? );
  `, [ league_id, club_name, club_name_short, logo_url, small_logo_url ])
}

const clubById = id => {
  return query(`
    SELECT * FROM league_club
    WHERE id = ?;
  `, [ id ])
}

const leagueTeams = id => {
  return query(`
    SELECT * FROM team
    WHERE league_id = ?;
  `, [id])
}

const leagueGames = (id, season) => {
  season = season == 'all' ? season : parseInt(season)

  return query(`
    SELECT 
      *, 
      league_game.id id,
      home_club.logo_url home_club_logo_url, 
      home_club.small_logo_url home_small_club_logo_url, 
      away_club.logo_url away_club_logo_url,
      away_club.small_logo_url away_small_club_logo_url,
      home_club.club_name home_club_name,
      away_club.club_name away_club_name,
      away_club.club_name_short away_club_short_name,
      home_club.club_name_short home_club_short_name,
      YEAR(FROM_UNIXTIME(league_game.starttime_unix / 1000)) - 1 as ye,
      MONTH(FROM_UNIXTIME(league_game.starttime_unix / 1000)) as mo,
      league.season_start_month as stmonth
    FROM league_game
    LEFT JOIN league ON league.id = league_game.league_id
    LEFT JOIN league_club as home_club ON home_club.id = league_game.home_club_id
    LEFT JOIN league_club as away_club ON away_club.id = league_game.away_club_id
    WHERE league_game.league_id = ? AND
      (
        ( 
          YEAR(FROM_UNIXTIME(league_game.starttime_unix / 1000)) = ? AND MONTH(FROM_UNIXTIME(league_game.starttime_unix / 1000)) >= league.season_start_month 
        )
        OR
        (
          YEAR(FROM_UNIXTIME(league_game.starttime_unix / 1000)) - 1 = ? AND MONTH(FROM_UNIXTIME(league_game.starttime_unix / 1000)) < league.season_start_month 
        )
        OR
        ? = 'all'
      ) 
    ORDER BY starttime_unix DESC;
  `, [id, season, season, season])
}

const putLeagueGame = game => {
  let { id, home_club_id, away_club_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type, game_info, game_error, shown_live, season_id } = game
  return query(`
    UPDATE league_game
    SET home_club_id=?, away_club_id=?, score_home=?,
    score_away=?, starttime_unix=?, publishtime_unix=?,
    analyzed=?, will_be_analyzed=?, video_url=?, video_type=?, game_info=?, game_error=?, shown_live=?, season_id=?
    WHERE id = ?;
  `, [ home_club_id, away_club_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type, game_info, game_error, shown_live, season_id, id ])
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

const addClubToLeague = team => {
  return query(`
    INSERT INTO league_club (league_id, team_name, logo_url)
    VALUES ?;
  `, team)
}

const addGameToLeague = game => {
  let { league_id, home_club_id, away_club_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type, game_info, game_error, shown_live, season_id } = game
  analyzed = false

  return query(`
    INSERT INTO league_game (league_id, home_club_id, away_club_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type, game_info, game_error, shown_live, season_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [ league_id, home_club_id, away_club_id, score_home, score_away, starttime_unix, publishtime_unix, analyzed, will_be_analyzed, video_url, video_type, game_info, game_error, shown_live, season_id ])
}

const getLeagueGameById = id => {
  return query(`
    SELECT 
      *,
      league_game.id as id,
      home_club.small_logo_url home_club_small_logo_url,
      home_club.logo_url home_club_logo_url,
      away_club.small_logo_url away_club_small_logo_url,
      away_club.logo_url away_club_logo_url,
      home_club.club_name home_club_name,
      away_club.club_name away_club_name,
      away_club.club_name_short away_club_short_name,
      home_club.club_name_short home_club_short_name
    FROM league_game
    LEFT JOIN league_club as home_club ON home_club.id = league_game.home_club_id
    LEFT JOIN league_club as away_club ON away_club.id = league_game.away_club_id
    WHERE league_game.id = ?;
  `, [id])
}

const deleteGame = id => {
  return query(`
    DELETE FROM league_game
    WHERE id = ?;
  `, [id])
}

const leagueTeamById = id => {
  return query(`
    SELECT * FROM league_club
    WHERE id = ?;
  `, [id])
}

const deleteLeagueTeamById = id => {
  return query(`
    DELETE FROM league_club
    WHERE id = ?;
  `, [id])
}

module.exports = { 
  getLeagues, 
  leagueWhereAdmin, 
  addClubToLeague, 
  leagueTeamById,
  deleteLeagueTeamById,
  leagueClubs,
  addGameToLeague,
  getLeagueGameById,
  leagueGames,
  putLeagueGame,
  deleteGame,
  leagueTeams,
  updateLeague,
  getLeague,
  addLeagueClub,
  clubById,
  updateClub
}
