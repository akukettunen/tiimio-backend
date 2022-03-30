const clip_db = require('../db/clip')

const clipById = async id => {
  const [ clip ] = await clip_db.videoByClipId(id)

  const tags = await clip_db.clipTagsByClipId(id)

  return { ...clip, tags, num_of_tags: tags.length }
}

module.exports = { clipById }