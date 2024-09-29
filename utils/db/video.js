const { query } = require('./index.js')

const postVideo = ({ duration, id, title, description, original_url, original_type, s3_key, original_size, team_id, uploader, job_id, service, sample_video, encoded }) => {
  return query(`
    INSERT INTO video
    (id, title, description, original_url, original_type, original_size, s3_key, uploader, team_id, encoded, uploaded, job_id, service, duration, sample_video)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?);
  `, [ id, title, description, original_url, original_type, original_size, s3_key, uploader, team_id, encoded || 0, job_id, service, duration, sample_video ])
}

const planByTeamId = id => {
  return query(`
    SELECT * FROM plan
    LEFT JOIN team ON plan.id = team.plan_id
    WHERE team.id = ?;
  `, [id])
}

const teamVideos = id => {
  return query(`
    SELECT
      *
    FROM video
    WHERE team_id = ? AND deleted = false
    ORDER BY uploaded DESC;
  `, [ id, id ])
}

const teamVideosIdsOnly = (id, index, limit) => {
  return query(`
    SELECT
      id
    FROM video
    WHERE team_id = ? AND deleted = false
    ORDER BY uploaded DESC
    ${ limit ? 'LIMIT ?, ?' : '' };
  `, [ id, index, limit ])
}

const teamVideosLimits = (id, index, limit) => {
  return query(`
    SELECT
      *
    FROM video
    WHERE team_id = ? AND deleted = false
    ORDER BY uploaded DESC
    ${ limit ? 'LIMIT ?, ?' : '' };
  `, [ id, index, limit ])
}

const leagueGamesLimits = (league_id, index, limit) => {
  return query(`
    SELECT
      *, league_game.id as id, home_team.short_name as home_short_name, away_team.short_name as away_short_name
    FROM league_game
    LEFT JOIN league_club as home_team ON league_game.home_team_id = home_team.id
    LEFT JOIN league_club as away_team ON league_game.away_team_id = away_team.id
    WHERE league_game.league_id = ?
    ORDER BY starttime_unix DESC
    ${ limit ? 'LIMIT ?, ?' : '' };
  `, [ league_id, index, limit ])
}

const teamVideosByIds = (id, ids, index, limit) => {
  return query(`
    SELECT
      id
    FROM video
    WHERE team_id = ? AND deleted = false AND id IN (?)
    ORDER BY uploaded DESC
    ${ limit ? 'LIMIT ?, ?' : ''};
  `, [ id,  ids, index, limit])
}

const teamVideosByIdsLimits = (id, ids, index, limit) => {
  return query(`
    SELECT
      *
    FROM video
    WHERE team_id = ? AND deleted = false AND id IN (?)
    ORDER BY uploaded DESC
    ${ limit ? 'LIMIT ?, ?' : ''};
  `, [ id,  ids, index, limit])
}

const teamGamesByIdsLimits = (id, ids, index, limit) => {
  return query(`
    SELECT
      *, league_game.id as id, home_team.short_name as home_short_name, away_team.short_name as away_short_name
    FROM league_game
    LEFT JOIN league_club as home_team ON league_game.home_team_id = home_team.id
    LEFT JOIN league_club as away_team ON league_game.away_team_id = away_team.id
    WHERE league_game.league_id = ? AND league_game.id IN (?)
    ORDER BY starttime_unix DESC
    ${ limit ? 'LIMIT ?, ?' : ''};
  `, [ id,  ids, index, limit])
}

const leagueGamesByIdsLimits = (id, ids, index, limit) => {
  return query(`
    SELECT
      *
    FROM league_game
    WHERE league_id = ? AND id IN (?)
    ORDER BY starttime_unix DESC
    ${ limit ? 'LIMIT ?, ?' : ''};
  `, [ id,  ids, index, limit])
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

const videoDone = ({ thumb_url, lazy_thumb_url, job_id, mp4_url, mp4_s3_url, duration, duration_ts }) => {
  return query(`
    UPDATE video
    SET thumb_url = ?, lazy_thumb_url = ?, mp4_url = ?, mp4_s3_url = ?, encoded = true, duration = ?, duration_ts = ?
    WHERE job_id = ?;
  `, [thumb_url, lazy_thumb_url, mp4_url, mp4_s3_url, duration, duration_ts, job_id]) // job id has to be last
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

module.exports = { teamGamesByIdsLimits, leagueGamesByIdsLimits, leagueGamesLimits, teamVideosByIdsLimits, teamVideosLimits, teamVideosIdsOnly, teamVideosByIds, planByTeamId, videoByJobId, uploadedTotalNotDeleted, uploadedThisMonth, updateVideoTitle, deleteById, postVideo, teamVideos, videoDone, videoById }