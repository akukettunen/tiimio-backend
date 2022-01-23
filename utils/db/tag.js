const { query } = require('./index.js')

const teamGroups = team_id => {
  return query(`
    SELECT * FROM tag_group
    WHERE team_id = ?;
  `, [team_id])
}

const teamTags = team_id => {
  return query(`
    SELECT tag_name, tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.team_id = ?;
  `, [team_id])
}

const createTagGroup = ({ team_id, group_name }) => {
  return query(`
    INSERT INTO tag_group( team_id, group_name )
    VALUES (?, ?);
  `, [team_id, group_name])
}

const createTag = ({ tag_name, group_id }) => {
  return query(`
    INSERT INTO tag( tag_name, group_id )
    VALUES (?, ?);
  `, [ tag_name, group_id ])
}

const tagGroupById = id => {
  return query(`
    SELECT * FROM tag_group
    WHERE id = ?;
  `, [id])
}

const tagById = id => {
  return query(`
    SELECT * FROM tag
    WHERE id = ?;
  `, [id])
}

const deleteById = id => {
  return query(`
    DELETE FROM tag
    WHERE id = ?;
  `, [id])
}


module.exports = { deleteById, tagById, createTag, teamGroups, teamTags, createTagGroup, tagGroupById }