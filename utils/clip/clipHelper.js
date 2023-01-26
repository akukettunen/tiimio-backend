const clip_db = require('../db/clip')

const clipById = async (id, game_id) => {
  let clip
  if(!game_id) {
    clip = await clip_db.videoByClipId(id)
  } else {
    clip = await clip_db.gameByClipId(id)
  }
  let [ final_clip ] = clip
  const tags = await clip_db.clipTagsByClipId(id)

  const points = await clip_db.clipPointsByClipId(id)

  const { Item } = await clip_db.getClipGraphics(id)

  return { ...final_clip, tags, num_of_tags: tags.length, points, graphics: Item?.Item }
}

const videoClips = (video, groups) => {
  return new Promise((resolve, reject) => {
    clip_db.videoClips(video.id)
      .then(clips => {
        clips = clips.map(c => {
          return {
            ...c,
            tags: c.tags ? JSON.parse(c.tags) : [],
            points: c.points ? JSON.parse(c.points).filter(p => !!p.id) : []
          }
        }).filter(clip => clipIsIn(clip, groups))
        resolve({
          ...video,
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