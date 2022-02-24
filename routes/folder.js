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
      video_db = require('../utils/db/video')
      team_db = require('../utils/db/team')
      user_db = require('../utils/db/user')
      folder_db = require('../utils/db/folder')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);
      join_code = require('../utils/video/join_code')

router.get('/team/:team_id', user, async (req, res) => {
  is_in_team()

  if(!req.params.team_id) throw new Error('bad request')

  const folders = await folder_db.byTeamId(req.params.team_id)

  res.json(folders)
})

router.post('/', user, async (req, res) => {
  is_in_team()

  const folder = req.body.folder;

  if(!folder || !folder.name || !folder.team_id) {
    throw new Error('bad request')
  }

  const addData = await folder_db.addFolder(folder)
  const [ addedFolder ] = await folder_db.byId(addData.insertId)
  res.json(addedFolder)
})

router.put('/:id', user, async (req, res) => {
  // TODO parent cant be one of children or self
  is_in_team()

  const folder = req.body.folder;

  if(!folder.id || !folder.name) throw new Error('bad request')

  const fol = {
    ...req.body.folder,
    id: req.params.id
  }

  await folder_db.updateFolder(folder)
  const [ updated ] = await folder_db.byId(folder.id)

  res.json(updated)
})

router.delete('/:id', user, async (req, res) => {
  // TODO should delete children also

  if(!req.params.id) throw new Error('bad request')
  const [ folder ] = await folder_db.byId(req.params.id)
  if(!folder?.id) throw new Error('bad request')

  is_in_team(folder.team_id)

  await folder_db.deleteById(req.params.id)

  res.json({id: folder.id})
})

module.exports = router;