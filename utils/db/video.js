const { query } = require('./index.js')

const postVideo = ({ id, title, description, original_url, original_type, s3_key, original_size, team_id, uploader, job_id, service }) => {
  return query(`
    INSERT INTO video
    (id, title, description, original_url, original_type, original_size, s3_key, uploader, team_id, encoded, uploaded, job_id, service)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false, CURDATE(), ?, ?);
  `, [ id, title, description, original_url, original_type, original_size, s3_key, uploader, team_id, job_id, service ])
}

const teamVideos = id => {
  return query(`
    SELECT * FROM video
    WHERE team_id = ?;
  `, [ id ])
}

const videoDone = ({ thumb_url, lazy_thumb_url, job_id, mp4_url }) => {
  return query(`
    UPDATE video
    SET thumb_url = ?, lazy_thumb_url = ?, mp4_url = ?
    WHERE job_id = ?;
  `, [thumb_url, lazy_thumb_url, mp4_url, job_id])
}

module.exports = { postVideo, teamVideos, videoDone }