const { query } = require('./index.js')

const teamClips = (team_id, index = 0, limit = 5) => {
  return query(`
    SELECT 
      video.id,
      video.title,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'title', clip.title,
          'id', clip.id
        )

      ) clips
    FROM clip
    LEFT JOIN video ON video.id = clip.video_id
    WHERE video.team_id = ?
    GROUP BY video.id
    LIMIT ?, ?;
  `, [team_id, index, limit])
}

const addClip = ({ title, starttime, endtime, video_id, game_id, description, leaguewide, team_id }) => {
  return query(`
    INSERT INTO clip ( title, starttime, endtime, video_id, game_id, description, created, leaguewide, team_id )
    VALUES ( ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?);
  `, [ title, starttime, endtime, video_id, game_id, description, leaguewide, team_id ])
}

const clipById = id => {
  return query(`
    SELECT * FROM clip
    WHERE id = ?;
  `, [id])
}

const clipAndVideoByClipId = id => {
  return query(`
    SELECT * FROM clip
    LEFT JOIN video ON video.id = clip.video_id
    WHERE clip.id = ?;
  `, [id])
}

const clipTagsByClipId = id => {
  return query(`
    SELECT * FROM object_tag
    LEFT JOIN tag ON tag.id = object_tag.tag_id
    WHERE object_tag.clip_id = ?;
  `, [id])
}

const clipPointsByClipId = id => {
  return query(`
    SELECT * FROM map_point
    LEFT JOIN map_base ON map_point.map_base_id = map_base.id
    WHERE map_point.clip_id = ?;
  `, [id])
}

const videoByClipId = id => {
  return query(`
    SELECT 
      *,
      clip.id AS id,
      clip.title as title,
      video.id AS video_id
    FROM clip
    JOIN video ON clip.video_id = video.id
    WHERE clip.id = ?;
  `, [id])
}

const gameByClipId = id => {
  return query(`
    SELECT 
      *,
      clip.id AS id,
      clip.title as title,
      league_game.id AS game_id
    FROM clip
    JOIN league_game ON clip.game_id = league_game.id
    WHERE clip.id = ?;
  `, [id])
}

const batchAddTag = (clip_id, tag_ids) => {
  return query(`
    INSERT INTO object_tag( clip_id, tag_id )
    VALUES ${tag_ids.map(id => `(${Number(clip_id)}, ${Number(id)})`)};
  `)
}

const batchRemoveTag = (clip_id, tag_ids) => {
  return query(`
    DELETE FROM object_tag
    WHERE tag_id IN (${tag_ids}) AND clip_id = ?;
  `, [clip_id])
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

const clipTags = id => {
  return query(`
    SELECT 
      clip_id,
      tag_id as id,
      group_id,
      tag_name as name
    FROM object_tag
    LEFT JOIN tag ON tag.id = object_tag.tag_id
    WHERE clip_id = ?;
  `, [id])
}

const deleteById = id => {
  return query(`
    DELETE FROM clip
    WHERE id = ?;
  `, [id])
}

const gameClips = (id, team_id) => {
  return query(`
    SELECT DISTINCT
      clip.*, 
      COUNT(object_tag.clip_id) as num_of_tags,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'name', tag.tag_name,
          'id', tag.id,
          'group_id', tag.group_id
        )
      ) tags,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'x', map_point.x,
          'y', map_point.y,
          'id', map_point.id,
          'map_base_id', map_point.map_base_id,
          'color', map_point.color,
          'style', map_point.style,
          'url', map_base.url
        )
      ) points
    FROM clip
    LEFT JOIN map_point ON map_point.clip_id = clip.id
    LEFT JOIN map_base ON map_point.map_base_id = map_base.id
    LEFT JOIN object_tag ON clip.id = object_tag.clip_id
    LEFT JOIN tag ON object_tag.tag_id = tag.id
    WHERE ( clip.game_id = ? AND clip.leaguewide = 1 ) OR ( clip.game_id = ? AND clip.team_id = ? )
    GROUP BY clip.id
    ORDER BY clip.starttime;
  `, [id, id, team_id])
}

const videoClips = id => {
  return query(`
    SELECT 
      clip.*,
      COUNT(object_tag.clip_id) as num_of_tags,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'name', tag.tag_name,
          'id', tag.id,
          'group_id', tag.group_id
        )
      ) tags,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'x', map_point.x,
          'y', map_point.y,
          'id', map_point.id,
          'map_base_id', map_point.map_base_id,
          'color', map_point.color,
          'style', map_point.style,
          'url', map_base.url,
          'clip_id', clip.id
        )
      ) points
    FROM clip
    LEFT JOIN object_tag ON clip.id = object_tag.clip_id
    LEFT JOIN tag ON object_tag.tag_id = tag.id
    LEFT JOIN map_point ON map_point.clip_id = clip.id
    LEFT JOIN map_base ON map_point.map_base_id = map_base.id
    WHERE clip.video_id = ? OR clip.game_id = ?
    GROUP BY clip.id
    ORDER BY starttime;
  `, [id, id])
}

const ruleById = id => {
  return query(`
    SELECT * FROM clipper_rule
    WHERE id = ?;
  `, [id])
}

const putRule = rule => {
  return query(`
    UPDATE clipper_rule
    SET if_rule = ?, then_rule = ?, when_rule = ?, else_rule = ?
    WHERE id = ?;
  `, [ rule.if_rule, rule.then_rule, rule.when_rule, rule.else_rule, rule.id ])
}

const postRule = rule => {
  return query(`
    INSERT INTO clipper_rule(if_rule, then_rule, when_rule, else_rule)
    VALUES( if_rule, then_rule, when_rule, else_rule );
  `, [ rule.if_rule, rule.then_rule, rule.when_rule, rule.else_rule ])
}

module.exports = { gameByClipId, gameClips, clipPointsByClipId, postRule, putRule, ruleById, teamClips, clipAndVideoByClipId, batchRemoveTag, clipTags, clipTagsByClipId, deleteById, folderObjectById, addFolderObject, videoByClipId, batchAddTag, videoClips, addClip, clipById }