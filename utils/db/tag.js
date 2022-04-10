const { query } = require('./index.js')

const teamGroups = team_id => {
  return query(`
    SELECT * FROM tag_group
    WHERE team_id = ?;
  `, [team_id])
}

const teamGroupsIds = team_id => {
  return query(`
    SELECT id FROM tag_group
    WHERE team_id = ?;
  `, [team_id])
}

const groupById = id => {
  return query(`
    SELECT * FROM tag_group
    WHERE id = ?;
  `, [id])
}

const batchAddMirrorTag = (tags, group_id) => {
  return query(`
    INSERT INTO tag( original_id, tag_name, group_id )
    VALUES ${tags.map(tag => `(${tag.id}, '${tag.tag_name}', ${group_id})`)}
    ;
  `)
}

const groupMirrors = id => {
  return query(`
    SELECT * FROM tag_group_mirrors
    LEFT JOIN tag_group ON tag_group.id = tag_group_mirrors.tag_group_id
    LEFT JOIN tag_group AS mirroring ON mirroring.id = tag_group_mirrors.mirrors
    WHERE tag_group.id = ?;
  `, [id])
}

const groupTags = id => {
  return query(`
    SELECT * FROM tag
    WHERE group_id = ?;
  `, [id])
}

const teamTags = team_id => {
  return query(`
    SELECT tag_name, tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.team_id = ?;
  `, [team_id])
}

const teamTagsIdsFilter = (team_id, ids) => {
  return query(`
    SELECT tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.team_id = ? AND tag.id IN (?);
  `, [team_id, ids])
}

const teamMirrors = team_id => {
  return query(`
    SELECT * FROM tag_group_mirrors
    LEFT JOIN tag_group ON tag_group.id = tag_group_mirrors.tag_group_id
    LEFT JOIN tag_group AS mirroring ON mirroring.id = tag_group_mirrors.mirrors
    WHERE tag_group.team_id = ?;
  `, [team_id])
}

const createTagGroup = ({ team_id, group_name }) => {
  return query(`
    INSERT INTO tag_group( team_id, group_name )
    VALUES (?, ?);
  `, [team_id, group_name])
}

const addMirrors = (group_id, mirrors) => {
  return query(`
    INSERT INTO tag_group_mirrors( tag_group_id, mirrors )
    VALUES (?, ?);
  `, [group_id, mirrors])
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

const updateTagGroupName = ({ name, id }) => {
  return query(`
    UPDATE tag_group
    SET group_name = ?
    WHERE id = ?;
  `, [name, id])
}

const updateTagName = ({ name, id }) => {
  return query(`
    UPDATE tag
    SET tag_name = ?
    WHERE id = ?;
  `, [name, id])
}

const tagById = id => {
  return query(`
    SELECT * FROM tag
    WHERE id = ?;
  `, [id])
}

const deleteObjectTagById = id => {
  return query(`
    DELETE FROM object_tag
    WHERE tag_id = ?;
  `, [id])
} 

const deleteGroupById = id => {
  return query(`
    DELETE FROM tag_group
    WHERE id = ?;
  `, [id])
}

const deleteById = id => {
  return query(`
    DELETE FROM tag
    WHERE id = ?;
  `, [id])
}


module.exports = { teamGroupsIds, teamTagsIdsFilter, groupById, groupMirrors, batchAddMirrorTag, groupTags, teamMirrors, addMirrors, deleteGroupById, updateTagName, updateTagGroupName, deleteObjectTagById, deleteById, tagById, createTag, teamGroups, teamTags, createTagGroup, tagGroupById }
