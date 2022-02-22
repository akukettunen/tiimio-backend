const { query } = require('./index.js')

const byTeamId = teamId => {
  return query(`
    SELECT * FROM folder
    WHERE team_id = ?;
  `, [teamId])
}

const addFolder = folder => {
  const { team_id, name, parent, position } = folder
  return query(`
    INSERT INTO folder (
      team_id, name, created, parent, position
    )
    VALUES
    (?, ?, NOW(), ?, ?);
  `, [ team_id, name, parent, position ])
}

const byId = id => {
  return query(`
    SELECT * FROM folder
    WHERE id = ?
  `, [id])
}

module.exports = { byId, byTeamId, addFolder }