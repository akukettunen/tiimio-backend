const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcrypt')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      clip_db = require('../utils/db/clip')
      require('express-async-errors');
      const { user } = require('../middleware/authMiddleware')

router.post('/', user, async (req, res) => {
  // TOOD: check that clip is saved to same team
  
  let added = await clip_db.addClip(req.body)

  let [ clip ] = await clip_db.clipById(added.insertId)

  if(!clip) throw new Error('added clip not found')

  res.json(clip)
})



module.exports = router;