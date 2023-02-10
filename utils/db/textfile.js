const { query } = require('./index.js')

const byTeam = ({ team_id }) => {
  return query(`
    SELECT * FROM text_file WHERE team_id = ?;
  `, [ team_id ])
}

const byId = ({ id }) => {
  return query(`
    SELECT * FROM text_file WHERE id = ?;
  `, [ id ])
}

const post = ({ title, text, team_id }) => {
  return query(`
    INSERT INTO text_file ( title, text_file, team_id )
    VALUES ( ?, ?, ? );
  `, [title, text, team_id])
}

const update = ({ title, text, id }) => {
  return query(`
    UPDATE text_file
    SET text_file = ?, title = ?
    WHERE id = ?;
  `, [ text, title, id ])
}

module.exports = { byTeam, byId, post, update }