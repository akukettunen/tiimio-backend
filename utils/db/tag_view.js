const { query } = require('./index.js')

const getTeamTagViews = id => {
  return query(`
    SELECT * FROM tag_view
    WHERE team_id = ?
    ORDER BY position ASC;
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

module.exports = { teamTagGroups, createDefaultView, getTeamTagViews, getTagViewGroups, getTagGroupTags, updateTagGroup }
