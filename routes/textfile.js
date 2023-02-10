const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      folder_db = require('../utils/db/folder')
      file_db = require('../utils/db/textfile')
      require('express-async-errors');
      const { user, is_in_team, tiimi_admin } = require('../middleware/authMiddleware');

router.get('/team/:team_id',is_in_team, user, async (req, res) => {
  if(!req.params.team_id) throw new Error('bad request');

  const files = await file_db.byTeam({ team_id: req.params.team_id })

  res.json(files)
})

router.get('/:id', user, async (req, res) => {
  if(!req.params.id) throw new Error('bad request');
  console.log(req.params.id)
  console.log(req.params.id)
  const [ file ] = await file_db.byId({ id: req.params.id })

  res.json(file)
})

router.post('/', async (req, res) => {
  const { title, text, team_id } = req.body;

  if(!title || !text || !team_id) throw new Error('bad request')

  const insertData = await file_db.post({ title, text, team_id })

  const [ file ] = await file_db.byId({ id: insertData.insertId })

  res.json(file)
})

router.put('/:id', async (req, res, next) => {
  const id = req.params.id;
  const { title, text } = req.body;

  if(!title || !text) throw new Error('bad request')

  const [ file ] = await file_db.byId({ id })

  try {
    is_in_team(file.team_id)(req)
  } catch(e) {
    throw new Error(e)
  }

  await file_db.update({ title, text, id })

  const [ updatedFile ] = await file_db.byId({ id })

  res.json(updatedFile)
})

module.exports = router;
