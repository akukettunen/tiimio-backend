const { query } = require('./index.js')

const teamHotkeys = team_id => {
  return query(`
    SELECT * FROM hotkey
    WHERE team_id = ?
    ORDER BY hotkey, shift, tag_id;
  `, [ team_id ])
}

module.exports = { teamHotkeys }