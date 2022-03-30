const video_db = require('../db/video')

const jobDone = async job => {
// {
//   job_id: 'az1o3KxiNALD61',
//   event: 'job.completed',
//   metadata: false,
//   data: {
//     type: 'job',
//     status: 'job.completed',
//     progress: '100%',
//     id: 'az1o3KxiNALD61',
//     created_at: '2022-01-05 17:38:29 +0000',
//     completed_at: '2022-01-05 17:38:34 +0000',
//     input: { status: 'input.transferred' },
//     outputs: [ [Object], [Object], [Object] ]
//   }
// }
  const [ video ] = await video_db.videoByJobId(job.job_id)
  const [ { uploaded_this_month } ] = await video_db.uploadedThisMonth(video.team_id)
  const [ team ] = await team_db.teamById(video.team_id)
  const threshold_hours = team.upload_hours_per_month

  const [thumb_url, lazy_thumb_url] = job.data.outputs
    .filter(output => output.type == 'image')
    .sort((a, b) => {
      const first = a.format.split(':')[1].split('x')[0]
      const second = b.format.split(':')[1].split('x')[0]
      return parseInt(second) - parseInt(first)
    })

  const videos = job.data.outputs.filter(output => output.type == 'video')

  let mp4_s3_url = videos.find(video => video.key.split(':')[0] == 'mp4').url

  let split = mp4_s3_url.split('/')
  let tail = split[split.length - 1]
  let key = split[split.length - 2]
  let mp4_url = `${process.env.CLOUDFRONT_BASE}/${key}/${tail}`

  let { duration_ts, duration } = videos[0].metadata.streams[0]
  duration = parseFloat(duration)
  const validated = (uploaded_this_month + duration) < (threshold_hours * 60 * 60)

  const params = {
    duration,
    duration_ts,
    thumb_url: thumb_url.urls[0],
    lazy_thumb_url: lazy_thumb_url.urls[0],
    job_id: job.job_id,
    mp4_url,
    mp4_s3_url
  }

  if(!validated) throw new Error('Upload hours exceeded for this month!')

  try {
    await video_db.videoDone(params)
  } catch(e) {
    throw new Error('Something went wrong :/')
  }
}

const jobFailed = async job => {
  
}

module.exports = { jobDone }