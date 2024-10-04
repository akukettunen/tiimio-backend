const { query } = require('./index.js')

const createSeason = ({ starttime, endtime, season_name, season_info, league_id }) => {
  return query(`
    INSERT INTO league_season ( starttime, endtime, season_name, season_info, league_id )
    VALUES ( FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?, ?, ? );
  `, [ starttime, endtime, season_name, season_info, league_id ])
}

const getSeasonById = id => {
  return query(`
    SELECT * FROM league_season WHERE id = ?;
  `, [ id ])
}

const leagueSeasons = league_id => {
  return query(`
    SELECT * FROM league_season
    WHERE league_id = ?
    ORDER BY starttime DESC;
  `, [league_id])
}

const updateSeason = (id, updates) => {
  let fields = [];
  let values = [];

  for (const field in updates) {
    fields.push(`${ field } = ?`);
    values.push(updates[ field ]);
  }
  
  values.push(id);

  const q = `
    UPDATE league_season
    SET ${fields.join(', ')}
    WHERE id = ?;
  `

  return query(q, values)
}

module.exports = { updateSeason, leagueSeasons, createSeason, getSeasonById }