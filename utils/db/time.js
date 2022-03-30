const { query } = require('./index.js')

const byId = id => {
  return query(`
    SELECT 
      *,
      time.id as id,
      time.title as title
    FROM time
    LEFT JOIN video ON video.id = time.video_id
    WHERE time.id = ?;
  `, [ id ])
}

const fullById = id => {
  return query(`
    SELECT
      time.*,
      video.*,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'name', tag.tag_name,
          'id', tag.id,
          'group_id', tag.group_id
        )
      ) tags,
      #(
      #  SELECT
      #    JSON_ARRAYAGG(
      #      JSON_OBJECT(
      #        'timename_id', timename.id,
      #        'name', timename.name,
      #        'time', time_timename.time_from_first,
      #        'video_time', time_timename.video_time
      #      )
      #    ) data
      #  FROM time_timename
      #  LEFT JOIN timename ON time_timename.time_id = timename.id
      #  WHERE time_timename.time_id = ?
    FROM time
    LEFT JOIN video ON video.id = time.video_id
    LEFT JOIN object_tag ON time.id = object_tag.time_id
    LEFT JOIN tag ON object_tag.tag_id = tag.id
    WHERE time.id = ?;
  `, [ id, id ])
}

const deleteById = id => {
  return query(`
    DELETE FROM time
    WHERE id = ?;
  `, [ id ])
}

const timenameById = id => {
  return query(`
    SELECT * FROM timename
    WHERE id = ?;
  `, [ id ])
}

const batchAddTag = (time_id, tag_ids) => {
  return query(`
    INSERT INTO object_tag( time_id, tag_id )
    VALUES ${tag_ids.map(id => `(${time_id}, ${id})`)};
  `)
}

const batchRemoveTag = (time_id, tag_ids) => {
  return query(`
    DELETE FROM object_tag
    WHERE tag_id IN (${tag_ids}) AND time_id = ?;
  `, [time_id])
}

const timeTags = time_id => {
  return query(`
    SELECT 
      time_id,
      tag_id as id,
      group_id,
      tag_name as name
    FROM object_tag
    LEFT JOIN tag ON tag.id = object_tag.tag_id
    WHERE time_id = ?;
  `, [time_id])
}

const timeAndVideoByTimeId = time_id => {
  return query(`
    SELECT *
    FROM time
    LEFT JOIN video ON video.id = time.video_id
    WHERE time.id = ?;
  `, [time_id])
}

const teamTimenames = team_id => {
  return query(`
    SELECT * FROM timename
    WHERE team_id = ?
    ORDER BY name;
  `, [ team_id ])
}

const batchAddTimename = (team_id, timenameNames) => {
  return query(`
    INSERT INTO timename (team_id, name, created)
    VALUES ${ timenameNames.map(name => `( ${team_id}, '${name}', NOW() ) `) };
  `)
}

const teamTimes = (page = 0, itemsPerPage = 15, sortBy = 'video_id', sortDesc = true, team_id, columns = [], tags = []) => {
  let start = page * itemsPerPage

  let get_tags = tags.length ? `RIGHT JOIN (
    SELECT * FROM object_tag
    WHERE object_tag.tag_id IN (${tags})
  ) chosen_tags ON chosen_tags.time_id = time.id` : ''

  let limit = itemsPerPage >= 0 ? `LIMIT ?, ?` : ``

  return query(`
    SELECT
      mp4_url,
      time.id id,
      time.video_id,
      video.title as video_name,
      mp4_url as url,
      duration,
      time.title as title,
      duration_ts,
      lazy_thumb_url,
      thumb_url,
      time_timename.time_id as time_id,
      COUNT(chosen_timenames.id) as num_of_points,
      # MAX(time_timename.time_from_first) max_tff,
      # MIN(time_timename.time_from_first) min_tff,
      (
        MAX(time_timename.time_from_first) - MIN(time_timename.time_from_first)
      ) total_time,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'name', chosen_timenames.name,
          'time', time_timename.time_from_first,
          'video_time', time_timename.video_time
        )
      ) data
    FROM time
    LEFT JOIN video ON video.id = time.video_id
    LEFT JOIN time_timename ON time.id = time_timename.time_id
    RIGHT JOIN (
      SELECT * FROM timename
      WHERE timename.name IN (${columns})
    ) chosen_timenames ON chosen_timenames.id = time_timename.timename_id
    ${ get_tags }
    WHERE video.team_id = ?
    GROUP BY time_id
    ORDER BY ${sortBy} ${sortDesc ? 'DESC' : 'ASC'}
    ${limit};
  `, [team_id, start, itemsPerPage])
}

const timenameByName = name => {
  return query(`
    SELECT * FROM timename
    WHERE name = ?;
  `, [name])
}

const teamTotalTimes = (team_id, columns, tags) => {

  let get_tags = tags.length ? `RIGHT JOIN (
    SELECT * FROM object_tag
    WHERE object_tag.tag_id IN (${tags})
  ) chosen_tags ON chosen_tags.time_id = time.id` : ''

  return query(`
    SELECT
      COUNT(*) OVER () AS amount,
      time.id AS timeid
    FROM timename
    LEFT JOIN 
      time_timename 
      ON time_timename.timename_id = timename.id
    RIGHT JOIN time ON time.id = time_timename.time_id
    ${ get_tags }
    WHERE timename.name IN (${columns}) AND timename.team_id = ?
    GROUP BY timeid;
  `, [team_id])
}

const timenameAverages = (team_id, columns) => {
  return query(`
    SELECT
      name,
      AVG(time_timename.time_from_first) average
    FROM time_timename
    LEFT JOIN time ON time.id = time_timename.time_id
    LEFT JOIN video ON video.id = time.video_id
    LEFT JOIN timename ON timename.id = time_timename.timename_id
    WHERE timename.name IN (${columns}) AND video.team_id = ?
    GROUP BY timename.name;
  `, [ team_id ])
}

const createTime = ({video_id, title}) => {
  return query(`
    INSERT INTO time
    (video_id, title, created)
    VALUES (?, ?, NOW());
  `, [ video_id, title ])
}

const batchCreateTimeTimename = (timenames, time_id) => {
  return query(`
    INSERT INTO time_timename
    (timename_id, time_id, video_time, time_from_first)
    VALUES ${timenames.map(t =>  `(${t.timename_id}, ${time_id}, ${t.video_time}, ${t.time_from_first})`)}
    ;
  `, [ time_id ])
}

const timeTimenameByTimeId = id => {
  return query(`
    SELECT *, TIME_FORMAT(SEC_TO_TIME(time_from_first),'%i:%s:%f') pretty
    FROM time_timename
    LEFT JOIN timename ON timename.id = time_timename.timename_id
    WHERE time_timename.time_id = ?;
  `, [id])
}

const videoTimes = id => {
  return query(`
    SELECT 
      time.*, 
      COUNT(object_tag.time_id) as num_of_tags,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'name', tag.tag_name,
          'id', tag.id,
          'group_id', tag.group_id
        )
      ) tags
    FROM time
    LEFT JOIN object_tag ON time.id = object_tag.time_id
    LEFT JOIN tag ON object_tag.tag_id = tag.id
    WHERE time.video_id = ?
    GROUP BY time.id;
  `, [id])
}

const addTimename = timename => {
  return query(`
    INSERT INTO timename (team_id, name, created)
    VALUES (?, ?, NOW());
  `, [ timename.team_id, timename.name ])
}

const timeById = id => {
  return query(`
    SELECT
      time.*,
      COUNT(times_object_tags.time_id) as num_of_tags,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'name', tag.tag_name,
          'id', tag.id,
          'group_id', tag.group_id
        )
      ) tags
    FROM time
    LEFT JOIN (
      SELECT * FROM object_tag WHERE time_id = ?) as times_object_tags ON time.id = times_object_tags.time_id
    LEFT JOIN tag ON times_object_tags.tag_id = tag.id
    GROUP BY time.id;
  `, [id])
}

module.exports = { batchAddTimename, timenameAverages, timeById, batchRemoveTag, timeAndVideoByTimeId, timeTags, fullById, timenameByName, teamTotalTimes,teamTimes, deleteById, videoTimes, batchAddTag, timeTimenameByTimeId, createTime, batchCreateTimeTimename, teamTimenames, byId, addTimename, timenameById }