const express = require('express');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcrypt')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      tag_db = require('../utils/db/tag')
      stripe = require('../utils/stripe/index')
      require('express-async-errors');
      const { user } = require('../middleware/authMiddleware');

router.get('/team/:id', user, async (req, res) => {
  // TODO own team only
  if(!req.params.id) throw new Error('bad request')

  let groups = await tag_db.teamGroups(req.params.id)
  let tags = await tag_db.teamTags(req.params.id)

  groups.forEach((group, i) => {
    groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id)
  })

  res.json(groups)
})

router.post('/group', user, async (req, res) => {
  const { team_id, group_name } = req.body

  if(!team_id || !group_name || !group_id) throw new Error('bad request')

  let add_info = await tag_db.createTagGroup({
    team_id,
    group_name
  })

  let [ tag_group ] = await tag_db.tagGroupById(add_info.insertId)

  if(!tag_group) throw new Error('tag not found :(')

  res.json(tag_group)
})

router.post('/', user, async (req, res) => {
  const { title, group_id } = req.body

  if( !title || !group_id) throw new Error('bad request')

  let add_info = await tag_db.createTag({
    tag_name,
    group_id
  })

  let [ tag ] = await tag_db.tagById(add_info.insertId)

  if(!tag) throw new Error('tag not found :(')

  res.json(tag)
})


module.exports = router;