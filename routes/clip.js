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
      require('express-async-errors');
      const { user, is_in_team } = require('../middleware/authMiddleware')

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



module.exports = router;