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
  if(!req.params.team_id) throw new Error('bad request')

  is_in_team()

  const folders = await folder_db.byTeamId(req.params.team_id)

  res.json(folders)
})

router.get('/team/:team_id/parent/:parent_id', user, async (req, res) => {
  if(!req.params.team_id) throw new Error('bad request')
  if(!req.params.parent_id) throw new Error('bad request')
  is_in_team()
  
  let folders;
  let parent = req.params.parent_id

  if(parent === 'root') folders = await await folder_db.byTeamIdRoot(req.params.team_id)
  else folders = await folder_db.byTeamIdByParent(req.params.team_id, parent)

  res.json(folders)
})

router.get('/:id/clip', user, async (req, res) => {
  if(!req.params.id) throw new Error('bad request')

  const [ folder ] = await folder_db.byId(req.params.id)

  if(!folder) throw new Error('bad request')

  is_in_team(folder.team_id)

  const clips = await folder_db.folderClips(folder.id)

  res.json(clips)
})

router.put('/order', user, async (req, res) => {
  if(!req.body.folders || !req.body.team_id) throw new Error('bad request')
  is_in_team()

  const promises = req.body.folders.map((t, i) => {
    return folder_db.editFolderOrder(t, i)
  })

  await Promise.all(promises)

  res.json('ok!')
})

router.post('/', user, async (req, res) => {
  is_in_team()

  const folder = req.body.folder;

  if(!folder || !folder.name || !folder.team_id || !folder.type) {
    throw new Error('bad request')
  }
  console.log(folder)
  if(folder.type !== 'folder' && folder.type !== 'clip' && folder.type !== 'time') {
    throw new Error('folder type wrong')
  }

  const addData = await folder_db.addFolder(folder)
  const [ addedFolder ] = await folder_db.byId(addData.insertId)
  res.json(addedFolder)
})

router.post('/clip-batch', user, async (req, res) => {
  const clips = req.body.clips; // { id: 1, title: 'Jea' }
  const parentId = req.body.parent_id;
  const team_id = req.body.team_id;
  console.log(clips, parentId, team_id)
  is_in_team()

  if(!clips || !clips.length) {
    throw new Error('bad request')
  }

  const promises = clips.map(clip => {
    return folder_db.addFolder({
      team_id,
      clip_id: clip.id,
      name: clip.title,
      parent: parentId,
      type: 'clip'
    })
  })

  Promise.all(promises)
    .then(async () => {
      const folders = await folder_db.byTeamId(team_id)

      res.json(folders)
    })
    .catch(e => {
      throw new Error(e)
    })
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