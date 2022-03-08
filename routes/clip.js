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
      require('express-async-errors');
      const { user, is_in_team } = require('../middleware/authMiddleware');

router.post('/', user, async (req, res) => {
  const { title, starttime, endtime, video_id, description, tags } = req.body
  // TOOD: check that clip is saved to same team
  if(!title || !starttime || !endtime || !video_id ) throw new Error('bad request')
  
  let added = await clip_db.addClip(req.body)

  let [ clip ] = await clip_db.clipById(added.insertId)
  if(!clip) throw new Error('added clip not found')
  
  if(tags && tags.length) await clip_db.batchAddTag(clip.id, tags)

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