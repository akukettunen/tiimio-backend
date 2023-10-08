const { query } = require('./index.js')
      AWS = require("aws-sdk");

const postShare = ({ code, resource_type, valid_days, video_id, map_id, filter_id, presentation_id, clip_id, time_id, folder_id }) => {
  return query(`
    INSERT INTO share ( code, resource_type, valid_until, video_id, map_id, filter_id, presentation_id, clip_id, time_id, folder_id )
    VALUES ( ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?, ?, ?, ?, ?, ? );
  `, [ code, resource_type, valid_days, video_id, map_id, filter_id, presentation_id, clip_id, time_id, folder_id ])
}

const getShare = code => {
  return query(`
    SELECT * FROM share WHERE code = ? AND NOW() < valid_until;
  `, [ code ])
}

module.exports = { postShare, getShare }