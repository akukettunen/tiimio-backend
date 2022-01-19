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

const videoClips = id => {
  return query(`
    SELECT * FROM clip
    WHERE video_id = ?;
  `, [id])
}
module.exports = { videoClips, addClip, clipById }