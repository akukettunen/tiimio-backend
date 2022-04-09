const clip_db = require('../db/clip')

const clipById = async id => {
  const [ clip ] = await clip_db.videoByClipId(id)

  const tags = await clip_db.clipTagsByClipId(id)

  return { ...clip, tags, num_of_tags: tags.length }
}

const videoClips = (id, groups) => {
  return new Promise((resolve, reject) => {
    clip_db.videoClips(id)
      .then(clips => {
        clips = clips.map(c => {
          return {
            ...c,
            tags: c.tags ? JSON.parse(c.tags) : []
          }
        }).filter(clip => clipIsIn(clip, groups))
        resolve({
          video_id: id,
          clips
        })
      })
      .catch(e => reject(e))
  })
}

const clipIsIn = (clip, groups) => {
  let isIn = true;
  groups.forEach(group => {
    let tagIds = group.tags.map(t => t.id)
    let clipTagIds = clip.tags.map(t => t.id)

    const hasJoin = contains(tagIds, clipTagIds)

    if(!hasJoin) isIn = false;

    return
  })

  return isIn
}

const contains = (tagIds, clipTagIds) => {
  if(!tagIds || !tagIds.length) return true

  return tagIds.some(element => {
    return clipTagIds.includes(element);
  });
}

module.exports = { clipById, videoClips }