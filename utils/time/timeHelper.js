const time_db = require('../db/time')

const timeById = async id => {
  let time;
  try {
    time = await time_db.byId(id)
  } catch(e) {
    throw new Error(e)
  }

  [ time ] = time

  let tags, data;
  try {
    tags = await time_db.timeTags(id)
    data = await time_db.timeTimenameByTimeId(id)
  } catch(e) {
    throw new Error(e)
  }

  return {
    ...time,
    data,
    tags,
    num_of_tags: tags.length
  }
}

const videoTimes = async id => {
  const times = await time_db.videoTimes(id)

  const timepointPromises = times.map(time => {
    return time_db.timeTimenameByTimeId(time.id)
  })

  const timepoints = await Promise.all(timepointPromises)

  const timesAndPoints = times.map(time => {
    let points = timepoints.flat().filter(t => t.time_id == time.id)
    return {
      ...time,
      data: points
    }
  })

  return timesAndPoints
}

module.exports = { timeById, videoTimes }