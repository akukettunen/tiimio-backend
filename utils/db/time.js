const { query } = require('./index.js')

const byId = id => {
  return query(`
    SELECT * FROM time
    WHERE id = ?;
  `, [ id ])
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

const teamTimenames = team_id => {
  return query(`
    SELECT * FROM timename
    WHERE team_id = ?
    ORDER BY name;
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
    SELECT *
    FROM time_timename
    LEFT JOIN timename ON timename.id = time_timename.timename_id
    WHERE time_timename.time_id = ?;
  `, [id])
}

const videoTimes = id => {
  return query(`
    SELECT 
      time.*, 
      COUNT(object_tag.time_id) as num_of_tags 
    FROM time
    LEFT JOIN object_tag
    ON time.id = object_tag.time_id
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

module.exports = { deleteById, videoTimes, batchAddTag, timeTimenameByTimeId, createTime, batchCreateTimeTimename, teamTimenames, byId, addTimename, timenameById }