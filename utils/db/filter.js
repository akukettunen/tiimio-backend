const { query } = require('./index.js')

const addFilter = ({ team_id, title, description, include_videos, include_clips, include_times }) => {
  return query(`
    INSERT INTO filter (team_id, title, description, videos, clips, times, created)
    VALUES (?, ?, ?, ?, ?, ?, NOW());
  `, [ team_id, title, description, include_videos, include_clips, include_times ])
} 

const filterVideoIds = id => {
  return query(`
    SELECT video_id FROM filter_param
    WHERE filter_id = ? AND video_id IS NOT NUll;
  `, [id])
}

const filterTagIds = id => {
  return query(`
    SELECT tag_id FROM filter_param
    WHERE filter_id = ? AND tag_id IS NOT NUll;
  `, [id])
}

const batchAddFilterParamClip = (filter_id, tag_ids) => {
  return query(`
    INSERT INTO filter_param
    (filter_id, tag_id)
    VALUES ${tag_ids.map(t =>  `(${filter_id}, ${t})`)}
    ;
  `)
}

const batchAddFilterParamVideo = (filter_id, video_ids) => {
  return query(`
    INSERT INTO filter_param
    (filter_id, video_id)
    VALUES ${video_ids.map(t =>  `(${filter_id}, '${t}')`)}
    ;
  `)
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

module.exports = { filterTagIds, filterVideoIds, batchAddFilterParamVideo, teamFilters, addFilter, byId, batchAddFilterParamClip }