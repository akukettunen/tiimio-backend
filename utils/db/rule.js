const { query } = require('./index.js')

const saveTeamRule = ({ rule, rule_name, team_id, position }) => {
  return query(`
    INSERT INTO rule(rule, rule_name, position, active, team_id) 
    VALUES (?, ?, ?, true, ?);
  `, [rule, rule_name, position, team_id])
}

const teamRules = (team_id) => {
  return query(`
    SELECT * FROM rule
    WHERE team_id = ?;
  `, [ team_id ])
}

const byId = id => {
  return query(`
    SELECT * FROM rule
    WHERE id = ?;
  `, [ id ])
}

const deleteById = id => {
  return query(`
    DELETE FROM rule
    WHERE id = ?;
  `, [id])
}

const putRule = ({ name, rule, id }) => {
  return query(`
    UPDATE rule
    SET rule_name = ?, rule = ?
    WHERE id = ?;
  `, [ name, rule, id ])
}

const setActive = ({ active, id }) => {
  return query(`
    UPDATE rule
    SET active = ?
    WHERE id = ?;
  `, [ active, id ])
}

module.exports = { setActive, teamRules, saveTeamRule, byId, deleteById, putRule }