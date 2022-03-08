const time_db = require('../db/time')

const timeById = async id => {
  const timeNames = await time_db.timeTimenameByTimeId(id)
  const [ time ] = await time_db.byId(id)

  return {
    ...time,
    data: timeNames
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