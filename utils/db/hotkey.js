const { query } = require('./index.js')

const teamHotkeys = team_id => {
  return query(`
    SELECT * FROM hotkey
    WHERE team_id = ?
    ORDER BY hotkey, shift, tag_id;
  `, [ team_id ])
}

const updateHotkey = (id, hotkey, shift) => {
  return query(`
    UPDATE hotkey
    SET hotkey = ?, shift = ?
    WHERE id = ?;
  `, [ hotkey, shift, id ])
}

const hotkeyById = id => {
  return query(`
    SELECT * FROM hotkey
    WHERE id = ?;
  `, [ id ])
}

const addHotkey = ({ team_id, tag_id, hotkey, shift, automation_id, hotkey_action }) => {
  return query(`
    INSERT INTO hotkey (team_id, tag_id, hotkey, shift, automation_id, hotkey_action)
    VALUES (?, ?, ?, ?, ?, ?);
  `, [ team_id, tag_id, hotkey, shift, automation_id, hotkey_action ])
}

const deleteHotkey = (id, team_id) => {
  return query(`
    DELETE FROM hotkey
    WHERE id = ? AND team_id = ?;
  `, [ id, team_id ])
}

const leagueHotkeys = league_id => {
  return query(`
    SELECT * FROM hotkey
    WHERE league_id = ?;
  `, [ league_id ])
}

module.exports = { leagueHotkeys, deleteHotkey, addHotkey, hotkeyById, teamHotkeys, updateHotkey }