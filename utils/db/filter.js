const { query } = require('./index.js')

const addFilter = ({ team_id, title, description, include_videos, include_clips, include_times, search_games, league_id }) => {
  return query(`
    INSERT INTO filter (team_id, title, description, videos, clips, times, search_games, league_id, created)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW());
  `, [ team_id, title, description, include_videos, include_clips, include_times, search_games, league_id ])
} 

const filterVideoIds = id => {
  return query(`
    SELECT video_id, game_id FROM filter_param
    WHERE filter_id = ? AND (video_id IS NOT NUll OR game_id IS NOT NULL);
  `, [id])
}

const filterTags = id => {
  return query(`
    SELECT *, tag_id as id FROM filter_param
    LEFT JOIN tag ON tag.id = filter_param.tag_id
    WHERE filter_id = ? AND filter_param.tag_id IS NOT NUll;
  `, [id])
}

const batchAddFilterParamClip = (filter_id, tag_ids) => {
  const vals = tag_ids.map(id => {
    return [ filter_id, id ]
  })
  return query(`
    INSERT INTO filter_param (filter_id, tag_id)
    VALUES ?;
  `, [vals])
}

const updateTitle = (id, name) => {
  return query(`
    UPDATE filter
    SET title = ?
    WHERE id = ?;
  `, [name, id])
}

const batchAddFilterParamVideo = (filter_id, video_ids) => {
  const vals = video_ids.map(id => {
    return [ filter_id, id ]
  })

  return query(`
    INSERT INTO filter_param (filter_id, video_id)
    VALUES ?;
  `, [vals])
}

const teamFilters = id => {
  return query(`
    SELECT * FROM filter
    WHERE team_id = ?;
  `, [id])
}

const byId = id => {
  return query(`
    SELECT * FROM filter
    WHERE id = ?;
  `, [id])
}

const deleteById = id => {
  return query(`
    DELETE FROM filter
    WHERE id = ?;
  `, [id])
}

module.exports = { deleteById, updateTitle, filterTags, filterVideoIds, batchAddFilterParamVideo, teamFilters, addFilter, byId, batchAddFilterParamClip }