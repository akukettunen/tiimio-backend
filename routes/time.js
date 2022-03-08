require('dotenv').config()
const express = require('express');
const { user, is_in_team } = require('../middleware/authMiddleware');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      require('express-async-errors');
      time_db = require('../utils/db/time')
      time_helper = require('../utils/time/timeHelper')
      team_db = require('../utils/db/team')
      video_db = require('../utils/db/video')
      user_db = require('../utils/db/user')
      folder_db = require('../utils/db/folder')

router.get('/timename/team/:team_id', user, async (req, res) => {
  if(!req.params.team_id) throw new Error('bad request')
  
  is_in_team()

  let timenames = await time_db.teamTimenames(req.params.team_id)

  res.json(timenames)
})

router.post('/timename', user, async (req, res) => {
  is_in_team()

  const add = req.body

  if(!add || !add.name || !add.team_id) throw new Error('bad request')

  const addData = await time_db.addTimename(add)

  const timename = await time_db.timenameById(addData.insertId)

  res.json(timename)
})

router.post('/', user, async (req, res) => {
  const { video_id, timenames, title, tag_ids } = req.body

  if(!video_id || !timenames || !timenames.length) {
    throw new Error('bad request')
  }

  const [ video ] = await video_db.videoById(video_id)

  if(!video || !video.team_id) throw new Error('something went wrong :(')

  const timeAddData = await time_db.createTime({
    video_id,
    title
  })

  if(tag_ids?.length) await time_db.batchAddTag(timeAddData.insertId, tag_ids)
  
  await time_db.batchCreateTimeTimename(timenames, timeAddData.insertId)

  const time = await time_helper.timeById(timeAddData.insertId)
  
  res.json(time)
})

router.delete('/:id', user, async (req, res) => {
  if(!req.params.id) throw new Error('bad request')

  const [ time ] = await time_db.byId(req.params.id)

  if(!time) throw new Error('time not found :/')

  const [ video ] = await video_db.videoById(time.video_id)

  is_in_team(video.team_id)

  await time_db.deleteById(req.params.id)

  res.json('ok!')
})

module.exports = router;