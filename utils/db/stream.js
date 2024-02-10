const { query } = require('./index.js')

const postStream = ({ id, team_id, s3_key, original_url, mp4_url, service, title, original_type, original_size, hls_url, duration_ts, duration, thumb_url, uploaded, encoded }) => {
    return query(`
      INSERT INTO video
      (id, team_id, s3_key, original_url, mp4_url, service, title, original_type, original_size, hls_url, duration_ts, duration, thumb_url, uploaded, encoded )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [ id, team_id, s3_key, original_url, mp4_url, service, title, original_type, original_size, hls_url, duration_ts, duration, thumb_url, uploaded, encoded ])
  }

const updateDuration = ({ id, duration_ts, duration}) => {
    return query(`
      UPDATE video
      SET duration_ts = ?, duration = ?
      WHERE id = ?;
    `, [duration_ts, duration, id])
  }

const addStreamDetails = ({email, title, id}) => {
  return query(`
      UPDATE video 
      SET uploader = ?, title = ?
      WHERE id = ?;
  `, [email, title, id])
}

  module.exports = {postStream, updateDuration, addStreamDetails}