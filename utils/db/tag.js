const { query } = require('./index.js')

const teamGroups = team_id => {
  return query(`
    SELECT * FROM tag_group
    WHERE team_id = ?
    ORDER BY position;
  `, [team_id])
}

const leagueGroups = league_id => {
  return query(`
    SELECT * FROM tag_group
    WHERE league_id = ?
    ORDER BY position;
  `, [league_id])
}

const teamGroupsIds = team_id => {
  return query(`
    SELECT id FROM tag_group
    WHERE team_id = ?;
  `, [team_id])
}

const leagueGroupsIds = team_id => {
  return query(`
    SELECT id FROM tag_group
    WHERE league_id = ?;
  `, [team_id])
}

const editGroupOrder = (id, i) => {
  return query(`
    UPDATE tag_group
    SET position = ?
    WHERE id = ?;
  `, [i, id])
}

const groupById = id => {
  return query(`
    SELECT * FROM tag_group
    WHERE id = ?;
  `, [id])
}

const editTagOrder = (tag_id, position) => {
  return query(`
    UPDATE tag
    SET position = ?
    WHERE id = ?;
  `, [position, tag_id])
}

const batchAddMirrorTag = (tags, group_id) => {
  // no need to sanitize data fetched from db by backend
  return query(`
    INSERT INTO tag( original_id, tag_name, group_id )
    VALUES ${tags.map(tag => `(${tag.id}, '${tag.tag_name}', ${group_id})`)}
    ;
  `)
}

const deleteGroupTags = (group_id) => {
  return query(`
    DELETE FROM tag
    WHERE group_id = ?;
  `, [group_id])
}

const deleteGroupMirrors = group_id => {
  return query(`
    DELETE FROM tag_group_mirrors
    WHERE tag_group_id = ?;
  `, [group_id])
}

const batchAddGroups = (groups, team_id) => {
  // needs to be sanitized is used by user reqs
  return query(`
    INSERT INTO tag_group( team_id, group_name )
    VALUES ${groups.map(group => `(${team_id}, '${group}')`)}
    ;
  `)
}

const batchAddTags = (group_id, tags) => {
  // needs to be sanitized is used by user reqs
  return query(`
    INSERT INTO tag( tag_name, group_id )
    VALUES ${tags.map(tag => `('${tag}', ${group_id})`)}
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

const mirroringGroups = id => {
  return query(`
    SELECT * FROM tag_group_mirrors
    WHERE mirrors = ?;
  `, [id])
}

const groupTags = id => {
  return query(`
    SELECT * FROM tag
    WHERE group_id = ?
    ORDER BY position;
  `, [id])
}

const teamTags = team_id => {
  return query(`
    SELECT original_id, tag_name, tag.position, tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.team_id = ?
    ORDER BY position;
  `, [team_id])
}

const leagueTags = league_id => {
  return query(`
    SELECT original_id, tag_name, tag.position, tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.league_id = ?
    ORDER BY position;
  `, [league_id])
}

const setJoinId = (group_id, join_id) => {
  return query(`
    UPDATE tag_group
    SET show_in_join_w_group_tag = ?
    WHERE id = ?;
  `, [join_id, group_id])
}

const teamTagsIdsFilter = (team_id, ids) => {
  return query(`
    SELECT tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.team_id = ? AND tag.id IN (?)
    ORDER BY tag.position;
  `, [team_id, ids])
}

const leagueTagsIdsFilter = (league_id, ids) => {
  return query(`
    SELECT tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.league_id = ? AND tag.id IN (?)
    ORDER BY tag.position;
  `, [league_id, ids])
}

const teamMirrors = team_id => {
  return query(`
    SELECT * FROM tag_group_mirrors
    LEFT JOIN tag_group ON tag_group.id = tag_group_mirrors.tag_group_id
    LEFT JOIN tag_group AS mirroring ON mirroring.id = tag_group_mirrors.mirrors
    WHERE tag_group.team_id = ?;
  `, [team_id])
}

const leagueMirrors = league_id => {
  return query(`
    SELECT * FROM tag_group_mirrors
    LEFT JOIN tag_group ON tag_group.id = tag_group_mirrors.tag_group_id
    LEFT JOIN tag_group AS mirroring ON mirroring.id = tag_group_mirrors.mirrors
    WHERE tag_group.league_id = ?;
  `, [league_id])
}

const createTagGroup = ({ team_id, league_id, group_name }) => {
  return query(`
    INSERT INTO tag_group( team_id, league_id, group_name )
    VALUES (?, ?, ?);
  `, [team_id, league_id, group_name])
}

const addMirrors = (group_id, mirrors) => {
  return query(`
    INSERT INTO tag_group_mirrors( tag_group_id, mirrors )
    VALUES (?, ?);
  `, [group_id, mirrors])
}

const createTag = ({ tag_name, group_id, original_id, position }) => {
  return query(`
    INSERT INTO tag( tag_name, group_id, original_id, position )
    VALUES (?, ?, ?, ?);
  `, [ tag_name, group_id, original_id, position ])
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
    WHERE id = ? OR original_id = ?;
  `, [name, id, id])
}

const updateTagGroupShowInTagging = ({ show_in_tagging, id }) => {
  return query(`
    UPDATE tag_group
    SET show_in_tagging = ?
    WHERE id = ?;
  `, [show_in_tagging, id, id])
}

const updateTagGroupShowInFiltering = ({ show_in_filtering, id }) => {
  return query(`
    UPDATE tag_group
    SET show_in_filtering = ?
    WHERE id = ?;
  `, [show_in_filtering, id, id])
}

const tagById = id => {
  return query(`
    SELECT * FROM tag
    WHERE id = ?;
  `, [id])
}

const tagAndMirrorsById = id => {
  return query(`
    SELECT * FROM tag
    WHERE id = ? OR original_id = ?;
  `, [id, id])
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
    WHERE id = ? OR original_id = ?;
  `, [id, id])
}

module.exports = { setJoinId, leagueTagsIdsFilter, leagueGroupsIds, leagueTags, leagueMirrors, leagueGroups, editGroupOrder, deleteGroupMirrors, deleteGroupTags, updateTagGroupShowInFiltering, updateTagGroupShowInTagging, editTagOrder, batchAddTags, tagAndMirrorsById, mirroringGroups, batchAddGroups, teamGroupsIds, teamTagsIdsFilter, groupById, groupMirrors, batchAddMirrorTag, groupTags, teamMirrors, addMirrors, deleteGroupById, updateTagName, updateTagGroupName, deleteObjectTagById, deleteById, tagById, createTag, teamGroups, teamTags, createTagGroup, tagGroupById }
