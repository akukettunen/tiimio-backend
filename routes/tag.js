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
      tagHelper = require('../utils/tag')
      require('express-async-errors');
      const { user, is_in_team } = require('../middleware/authMiddleware');

router.get('/team/:team_id', user, is_in_team(), async (req, res) => {
  if(!req.params.team_id) throw new Error('bad request')

  let groups;
  try {
    groups = await tagHelper.getTeamTagGroups(req.params.team_id)
  } catch(err) {
    throw new Error(err)
  }

  res.json(groups)
})

router.post('/group', user, is_in_team(), async (req, res) => {
  const { team_id, group_name, mirrors } = req.body

  if(!team_id || !group_name ) throw new Error('bad request')

  let add_info = await tag_db.createTagGroup({
    team_id,
    group_name
  })

  let [ tag_group ] = await tag_db.tagGroupById(add_info.insertId)
  if(!tag_group) throw new Error('tag group not found :(')

  let tags = []
  let groupMirrors = []
  if(mirrors && mirrors.length) {
    // add mirrorIndicators to this new group
    let mirrorsPromises = mirrors.map(m => {
      return tag_db.addMirrors(add_info.insertId, Number(m))
    })
    await Promise.all(mirrorsPromises)

    // get all tags in the groups that were mirroring at the moment
    let tagsPromises = mirrors.map(m => {
      return tag_db.groupTags(m)
    })
    tags = await Promise.all(tagsPromises)
    tags = tags.flat()

    // add those tags to db
    await tag_db.batchAddMirrorTag(tags, tag_group.id)
  }

  const newGroup = await tagHelper.groupById(add_info.insertId)

  res.json(newGroup)
})

router.put('/group/:group_id/name', user, async (req, res) => {
  if(!req.body.group_name) throw new Error('bad request')

  await tag_db.updateTagGroupName({ id: req.params.group_id, name: req.body.group_name })

  res.json('ok!')
})

router.put('/:tag_id/name', user, async (req, res) => {
  // TODO update mirroring too

  if(!req.body.tag_name) throw new Error('bad request')

  await tag_db.updateTagName({ id: req.params.tag_id, name: req.body.tag_name })

  res.json('ok!')
})

router.post('/', user, async (req, res) => {
  // TODO post to mirroring

  const { tag_name, group_id } = req.body

  if( !tag_name || !group_id) throw new Error('bad request')
  
  let [ group ] = await tag_db.tagGroupById(group_id)
  if(!group) throw new Error('group not found')

  let mirrors = await tag_db.mirroringGroups(group_id)
  mirrors = mirrors.map(m => m.tag_group_id)

  is_in_team(group.team_id)

  let add_info = await tag_db.createTag({
    tag_name,
    group_id
  })

  mirrors = mirrors.map(m => {
    return tag_db.createTag({
      tag_name,
      group_id: m,
      original_id: add_info.insertId
    })
  })

  await Promise.all(mirrors)

  let tags = await tag_db.tagAndMirrorsById(add_info.insertId)

  if(!tags) throw new Error('tag not found :(')

  res.json(tags)
})

router.delete('/group/:tag_group_id', user, async (req, res) => {
  // TODO delete mirroring too
  let [ group ] = await tag_db.tagGroupById(req.params.tag_group_id)
  if(!group) throw new Error('group not found')

  is_in_team(group.team_id)

  await tag_db.deleteGroupById(req.params.tag_group_id)

  res.send('ok!')
})

router.delete('/tag/:tag_id', async (req, res) => {
  // TODO delete from mirroring
  let [ tag ] = await tag_db.tagById(req.params.tag_id)
  if(!tag) throw new Error('tag not found')
  let [ group ] = await tag_db.tagGroupById(tag.group_id)
  if(!group) throw new Error('group not found')

  is_in_team(group.team_id)

  await tag_db.deleteById(req.params.tag_id)

  res.send('ok!')
})



module.exports = router;