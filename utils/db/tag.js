const { query } = require('./index.js')

const teamGroups = team_id => {
  return query(`
    SELECT 
      tag_group.*,
      JSON_ARRAYAGG( 
        tag_group_in_join_with.in_join_with 
      ) as show_in_join_w_group_tags
    FROM tag_group
    LEFT JOIN tag_group_in_join_with ON tag_group_in_join_with.tag_group_id = tag_group.id
    WHERE team_id = ?
    GROUP BY tag_group.id
    ORDER BY position;
  `, [team_id])
}

const groupById = id => {
  return query(`
    SELECT 
      tag_group.*,
      JSON_ARRAYAGG( 
        tag_group_in_join_with.in_join_with 
      ) as show_in_join_w_group_tags
    FROM tag_group
    LEFT JOIN tag_group_in_join_with ON tag_group_in_join_with.tag_group_id = tag_group.id
    WHERE id = ?;
  `, [id])
}

const tagGroupIdByNameAndTeamId = ({ name, team_id }) => {
  return query(`
    SELECT id FROM tag_group
    WHERE group_name = ? AND team_id = ?;
  `, [ name, team_id ])
}

const tagIdByNameAndTeamId = ({ name, team_id }) => {
  return query(`
    SELECT tag.id as id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_name = ? AND tag_group.team_id = ?;
  `, [ name, team_id ])
}

const leagueGroups = league_id => {
  return query(`
    SELECT 
      tag_group.*,
      JSON_ARRAYAGG( 
        tag_group_in_join_with.in_join_with 
      ) as show_in_join_w_group_tags
    FROM tag_group
    LEFT JOIN tag_group_in_join_with ON tag_group_in_join_with.tag_group_id = tag_group.id
    WHERE league_id = ?
    GROUP BY tag_group.id
    ORDER BY position;
  `, [league_id])
}

const sportGroups = sport_id => {
  return query(`
    SELECT 
      tag_group.*,
      JSON_ARRAYAGG( 
        tag_group_in_join_with.in_join_with 
      ) as show_in_join_w_group_tags
    FROM tag_group
    LEFT JOIN tag_group_in_join_with ON tag_group_in_join_with.tag_group_id = tag_group.id
    WHERE sport_id = ? AND team_id IS NULL
    GROUP BY tag_group.id
    ORDER BY position;
  `, [sport_id])
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

const editTagOrder = (tag_id, position) => {
  return query(`
    UPDATE tag
    SET position = ?
    WHERE id = ? OR original_id = ?;
  `, [position, tag_id, tag_id])
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

const batchAddGroups = (groups, team_id, immutable) => {
  // needs to be sanitized is used by user reqs
  return query(`
    INSERT INTO tag_group( team_id, group_name, immutable )
    VALUES ${groups.map(group => `(${team_id}, '${group}', ${immutable})`)}
    ;
  `)
}

const putGroupImmutability = (group_id, immutable) => {
  return query(`
    UPDATE tag_group
    SET immutable = ?
    WHERE id = ?;
  `, [ immutable, group_id ])
}

const tagsInGroup = (group_id) => {
  return query(`
    SELECT * FROM tag
    WHERE group_id = ?;
  `, [group_id])
}

const batchAddTags = (group_id, tags) => {
  // needs to be sanitized is used by user reqs
  return query(`
    INSERT INTO tag( tag_name, group_id )
    VALUES ${tags.map(tag => `('${tag}', ${group_id})`)}
    ;
  `)
}

const batchAddTagsComplex = (group_id, tags) => {
  // needs to be sanitized is used by user reqs
  return query(`
    INSERT INTO tag( tag_name, group_id, map_color, hotkey )
    VALUES ${tags.map(tag => `('${tag.tag_name}', ${group_id}, '${tag.map_color}', '${tag.hotkey}')`)}
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
    ORDER BY position, team_id;
  `, [id])
}

const teamTags = team_id => {
  return query(`
    SELECT original_id, tag.team_id as team_id, tag_name, tag.position, tag.id AS id, tag_group.one_tag_only AS one_tag_only ,group_id, tag.map_color, tag.hotkey, tag.keep_chosen FROM tag
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

const sportTags = sport_id => {
  return query(`
    SELECT tag.*, original_id, tag_name, tag.position, tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.sport_id = ? AND tag_group.team_id IS NULL
    ORDER BY position;
  `, [sport_id])
}

const tagsInGroups = (sport_id, ids) => {
  return query(`
    SELECT tag.*, original_id, tag_name, tag.position, tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.id IN (?) AND sport_id = ? AND tag_group.team_id IS NULL
    ORDER BY position;
  `, [ids, sport_id, true])
}

const teamSportTags = (sport_id, team_id) => {
  return query(`
    SELECT tag.*, original_id, tag_name, tag.position, tag.id AS id, group_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    WHERE tag_group.sport_id = ? AND (tag.team_id = ? OR tag.team_id IS NULL)
    ORDER BY position;
  `, [sport_id, team_id])
}

const setJoinId = (group_id, join_id) => {
  return query(`
    UPDATE tag_group
    SET show_in_join_w_group_tag = ?
    WHERE id = ?;
  `, [join_id, group_id])
}

const teamTagsIdsFilter = (team_id, ids, sport_id) => {
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

const sportMirrors = sport_id => {
  return query(`
    SELECT * FROM tag_group_mirrors
    LEFT JOIN tag_group ON tag_group.id = tag_group_mirrors.tag_group_id
    LEFT JOIN tag_group AS mirroring ON mirroring.id = tag_group_mirrors.mirrors
    WHERE tag_group.sport_id = ?;
  `, [sport_id])
}

const createTagGroup = ({ team_id, league_id, group_name, one_tag_only, sport_id, immutable, buffer_start, buffer_end, action_type, enduring }) => {
  return query(`
    INSERT INTO tag_group( team_id, league_id, group_name, one_tag_only, sport_id, immutable, buffer_start, buffer_end, action_type, enduring )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [team_id, league_id, group_name, one_tag_only, sport_id, immutable, buffer_start, buffer_end, action_type, enduring ])
}

const addMirrors = (group_id, mirrors) => {
  return query(`
    INSERT INTO tag_group_mirrors( tag_group_id, mirrors )
    VALUES (?, ?);
  `, [group_id, mirrors])
}

const createTag = ({ tag_name, group_id, original_id, position, map_color, hotkey, team_id, keep_chosen }) => {
  return query(`
    INSERT INTO tag( tag_name, group_id, original_id, position, map_color, hotkey, team_id, keep_chosen )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `, [ tag_name, group_id, original_id, position, map_color, hotkey, team_id, keep_chosen ])
}

const tagGroupById = id => {
  return query(`
    SELECT 
      tag_group.*,
      JSON_ARRAYAGG( 
        tag_group_in_join_with.in_join_with 
      ) as show_in_join_w_group_tags
    FROM tag_group
    LEFT JOIN tag_group_in_join_with ON tag_group_in_join_with.tag_group_id = tag_group.id
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

const updateOneTagOnly = ({ id, one_tag_only}) => {
  return query(`
    UPDATE tag_group
    SET one_tag_only = ?
    WHERE id = ?;
  `, [one_tag_only, id])
}

const updateTag = ({ id, tag_name, map_color, hotkey, keep_chosen }) => {
  return query(`
    UPDATE tag
    SET tag_name = ?, map_color = ?, hotkey = ?, keep_chosen = ?
    WHERE id = ? OR original_id = ?;
  `, [tag_name, map_color, hotkey, keep_chosen, id, id])
}

const updateTagName = ({ name, id }) => {
  return query(`
    UPDATE tag
    SET tag_name = ?
    WHERE id = ? OR original_id = ?;
  `, [name, id, id])
}

const updateTagHotkey = ({ hotkey, id }) => {
  return query(`
    UPDATE tag
    SET hotkey = ?
    WHERE id = ? OR original_id = ?;
  `, [hotkey, id, id])
}

const updateTagColor= ({ color, id }) => {
  return query(`
    UPDATE tag
    SET map_color = ?
    WHERE id = ? OR original_id = ?;
  `, [color, id, id])
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

const deleteGroupJoins = (id) => {
  return query(`
    DELETE FROM tag_group_in_join_with
    WHERE tag_group_id = ?;
  `, [id])
}

const addGroupJoins = (group_id, join_ids) => {
  return query(`
    INSERT INTO tag_group_in_join_with
    VALUES ${ join_ids.map( j_id => ` ( ${group_id}, ${j_id} ) ` ) };
  `)
}

const tagsById = ids => {
  return query(`
    SELECT * FROM tag
    WHERE id IN (?);
  `, [ids])
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

module.exports = { updateTag, tagsInGroups, tagIdByNameAndTeamId, tagGroupIdByNameAndTeamId, tagsById, teamSportTags, addGroupJoins, deleteGroupJoins, batchAddTagsComplex, tagsInGroup, putGroupImmutability, sportTags, sportMirrors, sportGroups, updateOneTagOnly, updateTagHotkey, updateTagColor, setJoinId, leagueTagsIdsFilter, leagueGroupsIds, leagueTags, leagueMirrors, leagueGroups, editGroupOrder, deleteGroupMirrors, deleteGroupTags, updateTagGroupShowInFiltering, updateTagGroupShowInTagging, editTagOrder, batchAddTags, tagAndMirrorsById, mirroringGroups, batchAddGroups, teamGroupsIds, teamTagsIdsFilter, groupById, groupMirrors, batchAddMirrorTag, groupTags, teamMirrors, addMirrors, deleteGroupById, updateTagName, updateTagGroupName, deleteObjectTagById, deleteById, tagById, createTag, teamGroups, teamTags, createTagGroup, tagGroupById }
