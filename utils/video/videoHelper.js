const { listByKey  } = '../aws/index'
const { v4: uuidv4 } = require('uuid');
const video_db = require('../db/video')
      timeHelper = require('../time/timeHelper')
      clip_db = require('../db/clip')


const deleteVideoFromS3 = async key => {
  const keys = await listByKey(key)
}

const addSampleVideo = async (team_id) => {
  let job_id = uuidv4()
  await video_db.postVideo({
    team_id,
    id: uuidv4(),
    title: "Sample video",
    service: "coconut",
    original_type: "video/mp4",
    original_size: 0,
    deleted: 0,
    duration_ts: 0,
    original_url: "https://tiimio-vid-prod.s3-accelerate.amazonaws.com/3c1cc3ce-d69b-43da-87fd-81ad8e48fa3b%2F3c1cc3ce-d69b-43da-87fd-81ad8e48fa3b",
    s3_key: "3c1cc3ce-d69b-43da-87fd-81ad8e48fa3b",
    uploader: "aku@kettunen.com",
    encoded: 1,
    sample_video: 1,
    job_id
  })

  await video_db.videoDone({
    thumb_url: "http://tiimio-vid-prod.s3.eu-west-1.amazonaws.com/ebec5338-783e-46b1-a1d9-05bb1a5c03c7/thumbnail_medium.jpg",
    lazy_thumb_url: "http://tiimio-vid-prod.s3.eu-west-1.amazonaws.com/ebec5338-783e-46b1-a1d9-05bb1a5c03c7/thumbnail_low.jpg",
    job_id: null,
    mp4_url: "https://d3a8wbzbl3mii4.cloudfront.net/ebec5338-783e-46b1-a1d9-05bb1a5c03c7/720p.mp4",
    mp4_s3_url: "http://tiimio-vid-prod.s3.eu-west-1.amazonaws.com/ebec5338-783e-46b1-a1d9-05bb1a5c03c7/720p.mp4",
    duration: 0,
    duration_ts: 0,
    job_id
  })
}

const getVideo = async id => {
  let [ video ] = await video_db.videoById(id)

  if(!video) throw new Error('video not found')
  let clips = await clip_db.videoClips(id)
  let times = await timeHelper.videoTimes(id)
  let mapped_times = times.map(t => {
    let parsed = JSON.parse(t.tags)
    return {
      ...t,
      tags: parsed[0]?.id ? parsed : []
    }
  })

  let mapped_clips = clips.map(t => {
    let parsed_tags = JSON.parse(t.tags)
    let parsed_points = JSON.parse(t.points)
    return {
      ...t,
      tags: parsed_tags[0]?.id ? parsed_tags : [],
      points: parsed_points[0]?.id ? parsed_points : []
    }
  })

  return { ...video, clips: mapped_clips, times: mapped_times }
}

module.exports = { addSampleVideo, getVideo }