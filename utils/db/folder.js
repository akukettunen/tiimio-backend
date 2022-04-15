const { query } = require('./index.js')

const byTeamId = teamId => {
  return query(`
    SELECT * FROM folder
    WHERE team_id = ?;
  `, [teamId])
}

const byTeamIdByParent = (teamId, parentId) => {
  return query(`
    SELECT * FROM folder
    WHERE team_id = ? AND parent = ?;
  `, [teamId, parentId])
}

const byTeamIdRoot = (teamId) => {
  return query(`
    SELECT * FROM folder
    WHERE team_id = ? AND parent IS NULL;
  `, [teamId])
}

const addFolder = folder => {
  const { team_id, time_id, clip_id, name, parent, position, type } = folder
  return query(`
    INSERT INTO folder (team_id, time_id, clip_id, name, created, parent, position, type)
    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?);
  `, [ team_id, time_id, clip_id, name, parent, position, type ])
}

const byId = id => {
  return query(`
    SELECT * FROM folder
    WHERE id = ?
  `, [id])
}

const editFolderOrder = (id, position) => {
  return query(`
    UPDATE folder
    SET POSITION = ?
    WHERE id = ?;
  `, [position, id])
}

const folderClips = id => {
  return query(`
    SELECT * FROM folder_object
    LEFT JOIN clip ON clip.id = folder_object.clip_id
    WHERE folder_id = ?;
  `, [id])
}

const updateFolder = ({ id, name, parent, position }) => {
  return query(`
    UPDATE folder
    SET name = ?, parent = ?, position = ?
    WHERE id = ?;
  `, [ name, parent, position, id ])
}

const deleteById = id => {
  return query(`
    DELETE FROM folder
    WHERE id = ?;
  `, [id])
}

module.exports = { editFolderOrder, byTeamIdByParent, byTeamIdRoot, folderClips, byId, byTeamId, addFolder, updateFolder, deleteById }