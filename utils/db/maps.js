const { query } = require('./index.js')

const sportMapBases = sport_id => {
  return query(`
    SELECT * FROM map_base
    WHERE sport_id = ?;
  `, [sport_id])
}

const addMap = ({ clip_id, team_id, title, description, map_base_id }) => {
  return query(`
    INSERT INTO map(clip_id, team_id, title, description, map_base_id, created)
    VALUES(?, ?, ?, ?, ?, NOW())
  `, [ clip_id, team_id, title, description, map_base_id ])
}

const mapById = id => {
  return query(`
    SELECT *, map.id as id FROM map
    LEFT JOIN map_base ON map_base_id = map_base.id
    WHERE map.id = ?;
  `, [id])
}

const addMapPoint = data => {
  return query(`
    INSERT INTO map_point( id, map_id, x, y, color, style, clip_id, map_base_id, end_x, end_y )
    VALUES ?;
  `, [data])
}

const deleteClipPoints = clip_id => {
  return query(`
    DELETE FROM map_point
    WHERE clip_id = ?;
  `, [clip_id])
}

const teamMaps = team_id => {
  return query(`
    SELECT *, map.id as id FROM map
    LEFT JOIN map_base ON map_base_id = map_base.id
    WHERE map.team_id = ?;
  `, [team_id])
}

const mapPoints = (map_id, limit) => {
  return query(`
    SELECT * FROM map_point
    WHERE map_id = ?
    ${limit ? 'LIMIT ?' : ''}
  `, [map_id, limit])
}

const deletePoints = map_id => {
  return query(`
    DELETE FROM map_point
    WHERE map_id = ?;
  `, [map_id])
}

const setTitle = (map_id, title) => {
  return query(`
    UPDATE map
    SET title = ?
    WHERE id = ?;
  `, [title, map_id])
}

const setDescription = (map_id, description) => {
  return query(`
    UPDATE map
    SET description = ?
    WHERE id = ?;
  `, [description, map_id])
}

const deleteMap = map_id => {
  return query(`
    DELETE FROM map
    WHERE id = ?;
  `, [map_id])
}

module.exports = { deleteClipPoints, deleteMap, setDescription, setTitle, deletePoints, mapPoints, teamMaps, sportMapBases, addMap, mapById, addMapPoint }