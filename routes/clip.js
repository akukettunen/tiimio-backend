const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      clip_db = require('../utils/db/clip')
      folder_db = require('../utils/db/folder')
      clip_helper = require('../utils/clip/clipHelper')
      require('express-async-errors');
      const { user, is_in_team } = require('../middleware/authMiddleware');

router.get('/team/:team_id', async (req, res) => {
  const { index, limit } = req.query;

  const videos = await clip_db.teamClips(req.params.team_id, index, limit)

  is_in_team()

  const parsed_videos = videos.map(video => {
    return {
      ...video,
      clips: JSON.parse(video?.clips)
    }
  })

  res.json({ videos: parsed_videos })
})

router.get('/:id', user, async (req, res) => {
  const clip = await clip_helper.clipById(req.params.id)

  is_in_team(clip.video_id)

  res.json(clip)
})

router.put('/:clip_id/tag', user, async (req, res) => {
  const [ clip ] = await clip_db.clipAndVideoByClipId(req.params.clip_id)

  is_in_team(clip.team_id)

  const current_tags = await clip_db.clipTags(req.params.clip_id)
  const new_tags_ids = req.body.tags
  const current_tags_ids = current_tags.map(t => t.id)
  
  const addIds = new_tags_ids.filter(n => !current_tags_ids.includes(n))
  const removeIds = 
    current_tags_ids
      .filter(n => !new_tags_ids.includes(n))
      .map(t => `'${t}'`)
  
  if(addIds?.length) {
    await clip_db.batchAddTag(req.params.clip_id, addIds)
  }
  if(removeIds?.length) {
    await clip_db.batchRemoveTag(req.params.clip_id, removeIds)
  }

  const updatedClip = await clip_helper.clipById(req.params.clip_id)
  console.log(updatedClip)
  res.json(updatedClip)
})

router.put('/:time_id/tag', user, async (req, res) => {
  const [ time ] = await time_db.timeAndVideoByTimeId(req.params.time_id)

  is_in_team(time.team_id)

  const current_tags = await time_db.timeTags(req.params.time_id)
  const new_tags_ids = req.body.tags
  const current_tags_ids = current_tags.map(t => t.id)

  const addIds = new_tags_ids.filter(n => !current_tags_ids.includes(n))
  const removeIds = 
    current_tags_ids
      .filter(n => !new_tags_ids.includes(n))
      .map(t => `'${t}'`)

  if(addIds?.length) {
    await time_db.batchAddTag(req.params.time_id, addIds)
  }
  if(removeIds?.length) {
    await time_db.batchRemoveTag(req.params.time_id, removeIds)
  }

  const updatedTime = await time_helper.timeById(req.params.time_id)

  res.json(updatedTime)
})

router.post('/', user, async (req, res) => {
  const { title, starttime, endtime, video_id, description, tags } = req.body
  // TOOD: check that clip is saved to same team
  if(!title || !starttime || !endtime || !video_id ) throw new Error('bad request')
  
  let added = await clip_db.addClip(req.body)
  
  if(tags && tags.length) await clip_db.batchAddTag(added.insertId, tags)
  
  let clip = await clip_helper.clipById(added.insertId)
  if(!clip) throw new Error('added clip not found')

  res.json({...clip, num_of_tags: tags.length })
})

// router.put('/:id', user, async (req, res) => {
//   const id = req.params.id
//   if(!id) throw new Error('bad request')

//   const [ video ] = await clip_db.videoByClipId(id)
//   if(!video || !video.team_id) throw new Error('something bad happened :(')

//   is_in_team(video.team_id)

  
// })

router.post('/:id/folder/:folder_id', user, async (req, res) => {
  const clip_id = req.params.id
  const folder_id = req.params.folder_id
  if(!clip_id || !folder_id) throw new Error('bad request')

  const [ video ] = await clip_db.videoByClipId(clip_id)
  if(!video || !video.team_id) throw new Error('something bad happened :(')

  const [ folder ] = await folder_db.byId(folder_id)

  if(!folder || !folder.team_id) throw new Error('something bad happened :(')

  is_in_team(video.team_id)
  is_in_team(folder.team_id)

  if(video.team_id !== folder.team_id) throw new Error('bad request')

  await clip_db.addFolderObject(clip_id, folder_id)
  const [ folder_object ] = await clip_db.folderObjectById(clip_id, folder_id)

  res.json(folder_object)
})

router.delete('/:id', user, async (req, res) => {
  if(!req.params.id) throw new Error('bad request')

  const [ clip ] = await clip_db.clipById(req.params.id)

  if(!clip) throw new Error('clip not found :/')

  const [ video ] = await video_db.videoById(clip.video_id)

  is_in_team(video.team_id)

  await clip_db.deleteById(req.params.id)

  res.json('ok!')
})



module.exports = router;