const { query } = require('./index.js')

const getPlayerByName = name => {
  return query(`
    SELECT * FROM player
    WHERE player_name = ?;
  `, [ name ])
}

const createPlayer = ({ league_id, league_club_id, picture_url, external_service_id, player_name }) => {
  return query(`
    INSERT INTO player (league_id, league_club_id, picture_url, external_service_id, player_name)
    VALUES (?, ?, ?, ?, ?);
  `, [league_id, league_club_id, picture_url, external_service_id, player_name]);
};

const deleteGamePlayers = (league_game_id) => {
  return query(`
    DELETE FROM game_player
    WHERE league_game_id = ?;
  `, [league_game_id]);
};

const createGamePlayer = ({ player_id, league_game_id, league_club_id, num, pos }) => {
  return query(`
    INSERT INTO game_player (player_id, league_game_id, league_club_id, num, pos)
    VALUES (?, ?, ?, ?, ?);
  `, [player_id, league_game_id, league_club_id, num, pos]);
};

const getGamePlayers = (league_game_id) => {
  return query(`
    SELECT * FROM game_player
    LEFT JOIN player ON game_player.player_id = player.id
    WHERE game_player.league_game_id = ?;
  `, [ league_game_id ])
}

const leaguePlayers = league_id => {
  return query(`
    SELECT * FROM player
    WHERE league_id = ?;
  `, league_id)
}

module.exports = { getPlayerByName, createPlayer, deleteGamePlayers, createGamePlayer, getGamePlayers, leaguePlayers }