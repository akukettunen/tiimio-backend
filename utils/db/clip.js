const { query } = require('./index.js')

const addClip = ({ title, starttime, endtime, video_id, description }) => {
  return query(`
    INSERT INTO clip ( title, starttime, endtime, video_id, description, created )
    VALUES ( ?, ?, ?, ?, ?, CURDATE() );
  `, [ title, starttime, endtime, video_id, description ])
}

const clipById = id => {
  return query(`
    SELECT * FROM clip
    WHERE id = ?;
  `, [id])
}

const videoByClipId = id => {
  return query(`
    SELECT * FROM clip
    JOIN video ON clip.video_id = video.id
    WHERE clip.id = ?;
  `, [id])
}

const batchAddTag = (clip_id, tag_ids) => {
  return query(`
    INSERT INTO object_tag( clip_id, tag_id )
    VALUES ${tag_ids.map(id => `(${clip_id}, ${id})`)};
  `)
}

const addFolderObject = (clip_id, folder_id) => {
  return query(`
    INSERT INTO folder_object( folder_id, type, created, clip_id )
    VALUES (?, 'clip', NOW(), ?);
  `, [folder_id, clip_id])
}

const folderObjectById = (clip_id, folder_id) => {
  return query(`
    SELECT * FROM folder_object
    WHERE clip_id = ? AND folder_id = ?;
  `, [clip_id, folder_id])
}

const videoClips = id => {
  return query(`
    SELECT *, COUNT(object_tag.clip_id) as num_of_tags FROM clip
    LEFT JOIN object_tag
    ON clip.id = object_tag.clip_id
    WHERE clip.video_id = ?
    GROUP BY clip.id;
  `, [id])
}

const deleteById = id => {
  return query(`
    DELETE FROM clip
    WHERE id = ?;
  `, [id])
}

module.exports = { deleteById, folderObjectById, addFolderObject, videoByClipId, batchAddTag, videoClips, addClip, clipById }