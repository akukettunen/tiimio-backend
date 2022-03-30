const express = require('express');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      tag_db = require('../utils/db/tag')
      stripe = require('../utils/stripe/index')
      require('express-async-errors');
      const { user, is_in_team } = require('../middleware/authMiddleware');

router.get('/team/:team_id', user, is_in_team(), async (req, res) => {
  if(!req.params.team_id) throw new Error('bad request')

  let groups = await tag_db.teamGroups(req.params.team_id)
  let tags = await tag_db.teamTags(req.params.team_id)

  groups.forEach((group, i) => {
    groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id)
  })

  res.json(groups)
})

router.post('/group', user, is_in_team(), async (req, res) => {
  const { team_id, group_name } = req.body

  if(!team_id || !group_name ) throw new Error('bad request')

  let add_info = await tag_db.createTagGroup({
    team_id,
    group_name
  })

  let [ tag_group ] = await tag_db.tagGroupById(add_info.insertId)

  if(!tag_group) throw new Error('tag not found :(')

  res.json({...tag_group, tags: []})
})

router.put('/group/:group_id/name', user, async (req, res) => {
  if(!req.body.group_name) throw new Error('bad request')

  await tag_db.updateTagGroupName({ id: req.params.group_id, name: req.body.group_name })

  res.json('ok!')
})

router.put('/:tag_id/name', user, async (req, res) => {
  if(!req.body.tag_name) throw new Error('bad request')

  await tag_db.updateTagName({ id: req.params.tag_id, name: req.body.tag_name })

  res.json('ok!')
})

router.post('/', user, async (req, res) => {
  const { tag_name, group_id } = req.body

  if( !tag_name || !group_id) throw new Error('bad request')
  
  let [ group ] = await tag_db.tagGroupById(group_id)
  if(!group) throw new Error('group not found')

  is_in_team(group.team_id)

  let add_info = await tag_db.createTag({
    tag_name,
    group_id
  })

  let [ tag ] = await tag_db.tagById(add_info.insertId)

  if(!tag) throw new Error('tag not found :(')

  res.json(tag)
})

router.delete('/:tag_id', async (req, res) => {
  let [ tag ] = await tag_db.tagById(req.params.tag_id)
  if(!tag) throw new Error('tag not found')
  let [ group ] = await tag_db.tagGroupById(tag.group_id)
  if(!group) throw new Error('group not found')

  is_in_team(group.team_id)

  await tag_db.deleteObjectTagById(req.params.tag_id)
  await tag_db.deleteById(req.params.tag_id)

  res.send('ok!')
})

router.delete('/group/:tag_group_id', user, async (req, res) => {
  let [ group ] = await tag_db.tagGroupById(req.params.tag_group_id)
  if(!group) throw new Error('group not found')

  is_in_team(group.team_id)

  await tag_db.deleteGroupById(req.params.tag_group_id)

  res.send('ok!')
})


module.exports = router;