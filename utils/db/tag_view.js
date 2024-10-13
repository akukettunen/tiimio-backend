const { query } = require('./index.js')

const getTeamTagViews = id => {
  return query(`
    SELECT * FROM tag_view
    WHERE team_id = ?
    ORDER BY position ASC;
  `, [ id ])
}

const getLeagueViews = id => {
  return query(`
    SELECT * FROM tag_view
    WHERE league_id = ?;  
  `, [ id ])
}

const getTagViewGroups = id => {
  return query(`
    SELECT * FROM tag_group
    WHERE tag_view_id = ?
    ORDER BY position;
  `, [ id ])
}

const getTagGroupTags = id => {
  return query(`
    SELECT * FROM tag
    WHERE group_id = ?
    ORDER BY position;
  `, [ id ])
}

const createDefaultView = team_id => {
  return query(`
    INSERT INTO tag_view ( tag_view_name, team_id, position )
    VALUES ( ?, ?, 0 )
  `, [ "Default view", team_id ])
}

const createTagView = ({ tag_view_name, team_id, position, league_id }) => {
  return query(`
    INSERT INTO tag_view ( tag_view_name, team_id, position, league_id )
    VALUES ( ?, ?, ?, ? )
`, [ tag_view_name, team_id, position, league_id ])
}

const tagViewById = id => {
  return query(`
    SELECT * FROM tag_view
    WHERE id = ?;
  `, [id])
}

const tagGroupById = id => {
  return query(`
    SELECT * FROM tag_group
    WHERE id = ?;
  `, [ id ])
}

const updateTag = (id, updates) => {
  let fields = [];
  let values = [];

  for (const field in updates) {
    fields.push(`${ field } = ?`);
    values.push(updates[ field ]);
  }
  
  values.push(id);

  const q = `
    UPDATE tag
    SET ${fields.join(', ')}
    WHERE id = ?;
  `

  return query(q, values)
}

const updateTagGroup = (id, updates) => {
  let fields = [];
  let values = [];

  for (const field in updates) {
    fields.push(`${ field } = ?`);
    values.push(updates[ field ]);
  }
  
  values.push(id);

  const q = `
    UPDATE tag_group
    SET ${fields.join(', ')}
    WHERE id = ?;
  `

  return query(q, values)
}

const teamTagGroups = team_id => {
  return query(`
    SELECT * FROM tag_group
    WHERE team_id = ?;
  `, [ team_id ])
}

const createTagGroup = ({ team_id, league_id, group_name, one_tag_only, sport_id, buffer_start, buffer_end, action_type, enduring, position = 0, show_in_filtering, tag_view_id }) => {
  return query(`
    INSERT INTO tag_group( team_id, league_id, group_name, one_tag_only, sport_id, buffer_start, buffer_end, action_type, enduring, position, show_in_filtering, tag_view_id )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [team_id, league_id, group_name, one_tag_only, sport_id, buffer_start, buffer_end, action_type, enduring, position, show_in_filtering, tag_view_id ])
}

const updateTagViewPosition = (id, position, team_id) => {
  // checks also team_id
  return query(`
    UPDATE tag_view
    SET position = ?
    WHERE id = ? AND team_id = ?;
  `, [ position, id, team_id ])
}

const updateTagViewPositionLeague = (id, position, league_id) => {
  return query(`
    UPDATE tag_view
    SET position = ?
    WHERE id = ? AND league_id = ?;
  `, [ position, id, league_id ])
}

const teamIdByGroupId = group_id => {
  return query(`
    SELECT tag_view.team_id as team_id, tag_view.league_id as league_id FROM tag_group
    LEFT JOIN tag_view ON tag_view.id = tag_group.tag_view_id
    WHERE tag_group.id = ?;
  `, [ group_id ])
}

const teamIdByTagId = tag_id => {
  return query(`
    SELECT tag_view.team_id as team_id, tag_view.league_id as league_id FROM tag
    LEFT JOIN tag_group ON tag_group.id = tag.group_id
    LEFT JOIN tag_view ON tag_view.id = tag_group.tag_view_id
    WHERE tag.id = ?;
  `, [ tag_id ])
}

const tagById = id => {
  return query(`
    SELECT * FROM tag
    WHERE id = ?;  
  `, [ id ])
}

const updateTagPosition = (id, position, group_id) => {
  return query(`
    UPDATE tag
    SET position = ?
    WHERE id = ? AND group_id = ?;
  `, [ position, id, group_id ])
}

const updateGroupPosition = (id, position, tag_view_id) => {
  return query(`
    UPDATE tag_group
    SET position = ?
    WHERE id = ? AND tag_view_id = ?;  
  `, [ position, id, tag_view_id ])
}

const updateTagView = (id, updates) => {
  let fields = [];
  let values = [];

  for (const field in updates) {
    fields.push(`${ field } = ?`);
    values.push(updates[ field ]);
  }
  
  values.push(id);

  const q = `
    UPDATE tag_view
    SET ${fields.join(', ')}
    WHERE id = ?;
  `

  return query(q, values)
}

const deleteTagView = id => {
  return query(`
    DELETE FROM tag_view
    WHERE id = ?;
  `, [ id ])
}

const deleteTagGroup = id => {
  return query(`
    DELETE FROM tag_group
    WHERE id = ?;
  `, [ id ])
}

const deleteTag = id => {
  return query(`
    DELETE FROM tag
    WHERE id = ?;
  `, [ id ])
}

const createTag = ({ tag_name, hotkey, map_shape, map_color, position,  group_id }) => {
  return query(`
    INSERT INTO tag ( tag_name, hotkey, map_shape, map_color, position, group_id )
    VALUES ( ?, ?, ?, ?, ?, ? );
  `, [ tag_name, hotkey, map_shape, map_color, position, group_id])
}

module.exports = { updateTagViewPositionLeague, getLeagueViews, updateGroupPosition, createTag, tagById, updateTag, teamIdByTagId, teamIdByGroupId, updateTagPosition, deleteTag, deleteTagGroup, deleteTagView, updateTagViewPosition, updateTagView, tagGroupById, createTagGroup, tagViewById, createTagView, teamTagGroups, createDefaultView, getTeamTagViews, getTagViewGroups, getTagGroupTags, updateTagGroup }
