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

  const [thumb_url, lazy_thumb_url] = job.data.outputs
    .filter(output => output.type == 'image')
    .sort((a, b) => {
      const first = a.format.split(':')[1].split('x')[0]
      const second = b.format.split(':')[1].split('x')[0]
      return parseInt(second) - parseInt(first)
    })

  const videos = job.data.outputs.filter(output => output.type == 'video')
  let mp4_url = videos.find(video => video.key.split(':')[0] == 'mp4').url

  let { duration_ts, duration } = videos[0].metadata.streams[0]
  duration = parseFloat(duration)
  
  const params = {
    duration,
    duration_ts,
    thumb_url: thumb_url.urls[0],
    lazy_thumb_url: lazy_thumb_url.urls[0],
    job_id: job.job_id,
    mp4_url
  }

  let video
  try {
    video = await video_db.videoDone(params)
  } catch(e) {
    throw new Error('something went wrong :/')
  }
}

module.exports = { jobDone }