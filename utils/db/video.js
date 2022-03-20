const { query } = require('./index.js')

const postVideo = ({ duration, id, title, description, original_url, original_type, s3_key, original_size, team_id, uploader, job_id, service }) => {
  return query(`
    INSERT INTO video
    (id, title, description, original_url, original_type, original_size, s3_key, uploader, team_id, encoded, uploaded, job_id, service, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false, CURDATE(), ?, ?, ?);
  `, [ id, title, description, original_url, original_type, original_size, s3_key, uploader, team_id, job_id, service, duration ])
}

const teamVideos = id => {
  return query(`
    SELECT
      *
    FROM video
    WHERE team_id = ? AND deleted = false;
  `, [ id, id ])
}

const uploadedThisMonth = team_id => {
  return query(`
    SELECT sum(duration) uploaded_this_month
    FROM video
    WHERE team_id = ? AND MONTH(uploaded) = MONTH(curdate());
  `, [team_id])
}

const uploadedTotalNotDeleted = team_id => {
  return query(`
    SELECT sum(duration) total_video_saved
    FROM video
    WHERE team_id = ? AND deleted = false;
  `, [team_id])
}

const videoDone = ({ thumb_url, lazy_thumb_url, job_id, mp4_url, duration, duration_ts }) => {
  return query(`
    UPDATE video
    SET thumb_url = ?, lazy_thumb_url = ?, mp4_url = ?, encoded = true, duration = ?, duration_ts = ?
    WHERE job_id = ?;
  `, [thumb_url, lazy_thumb_url, mp4_url, duration, duration_ts, job_id]) // job id has to be last
}

const videoByJobId = job_id => {
  return query(`
    SELECT * FROM video
    WHERE job_id = ?;
  `, [job_id])
}

const updateVideoTitle = ({ title, id }) => {
  return query(`
    UPDATE video
    SET title = ?
    WHERE id = ?;
  `, [title, id])
}

const videoById = id => {
  return query(`
    SELECT * FROM video
    WHERE id = ?;
  `, [id])
}

const deleteById = id => {
  return query(`
    UPDATE video
    SET deleted = true
    WHERE id = ?;
  `, [id])
}

module.exports = { videoByJobId, uploadedTotalNotDeleted, uploadedThisMonth, updateVideoTitle, deleteById, postVideo, teamVideos, videoDone, videoById }