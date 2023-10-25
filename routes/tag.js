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
      const { user, is_in_team, tiimi_admin, inline_tiimi_admin } = require('../middleware/authMiddleware');

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

router.get('/league/:league_id', user, async (req, res) => {
  if(!req.params.league_id) throw new Error('bad request')

  let groups;
  try {
    groups = await tagHelper.getLeagueTagGroups(req.params.league_id)
  } catch(err) {
    throw new Error(err)
  }

  res.json(groups)
})

router.get('/sport/:sport_id', tiimi_admin, async (req, res) => {
  if(!req.params.sport_id) throw new Error('bad request')

  let groups;
  try {
    groups = await tagHelper.getSportTagGroups(req.params.sport_id)
  } catch(err) {
    throw new Error(err)
  }

  res.json(groups)
})

router.post('/group', user, is_in_team(), async (req, res, next) => {
  let { team_id, group_name, mirrors, league_id, one_tag_only, sport_id, immutable } = req.body

  if( (!team_id && !league_id) || !group_name ) throw new Error('bad request')
  if(league_id || sport_id) team_id = null

  if(league_id || sport_id || immutable) {
    inline_tiimi_admin(req, res, next)
  }

  // if(sport_id) {
  //   await tagHelper.handleSportGroupAdd(group_name, sport_id)
  // }

  const groups = await tag_db.teamGroups(team_id)

  if(groups.find(g => g.group_name == group_name)) throw new Error(`Group "${group_name}" already exists`)

  let add_info = await tag_db.createTagGroup({
    team_id,
    league_id,
    group_name,
    one_tag_only,
    sport_id,
    immutable
  })

  let [ tag_group ] = await tag_db.tagGroupById(add_info.insertId)
  if(!tag_group) throw new Error('tag group not found :(')

  let tags = []
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

router.put('/order', user, async (req, res) => {
  if(!req.body.tags || !req.body.team_id) throw new Error('bad request')

  const promises = req.body.tags.map((t, i) => {
    return tag_db.editTagOrder(t, i)
  })

  await Promise.all(promises)

  res.json('ok!')
})

router.put('/group/:group_id/mirror', user, async (req, res) => {
  let group = await tagHelper.groupById(req.params.group_id)

  if(!group) throw new Error('Group not found')
  if(group.league_id || group.sport_id || group.immutable) inline_tiimi_admin(req)

  const new_mirror_ids = req.body.new_mirror_ids;

  if(!new_mirror_ids) throw new Error('bad request')

  await tag_db.deleteGroupMirrors(req.params.group_id)
  await tag_db.deleteGroupTags(req.params.group_id)

  // add mirrors object
  let mirrorsPromises = new_mirror_ids.map(m => {
    return tag_db.addMirrors(req.params.group_id, Number(m))
  })

  await Promise.all(mirrorsPromises)

  //add mirrors tags
  let tags = []
  // get all tags in the groups that were mirroring at the moment
  let tagsPromises = new_mirror_ids.map(m => {
    return tag_db.groupTags(m)
  })
  tags = await Promise.all(tagsPromises)
  tags = tags.flat()

  // add those tags to db
  if(tags.length) await tag_db.batchAddMirrorTag(tags, req.params.group_id)

  let newGroup = await tagHelper.groupById(req.params.group_id)
  res.json(newGroup)
})

router.put('/group/:group_id/join', user, async (req, res) => {
  let join_ids = req.body.join_ids
  let group = await tagHelper.groupById(req.params.group_id)

  if(!group) throw new Error('Group not found')
  if(group.league_id || group.sport_id || group.immutable) inline_tiimi_admin(req)

  await tag_db.deleteGroupJoins(req.params.group_id)
  if(join_ids && join_ids.length) await tag_db.addGroupJoins(req.params.group_id, join_ids)

  let newGroup = await tagHelper.groupById(req.params.group_id)

  res.json(newGroup)
})

router.put('/group/:group_id/name', user, async (req, res, next) => {
  if(!req.body.group_name) throw new Error('bad request')

  const group = await tagHelper.groupById(req.params.group_id)

  if(group.league_id || group.sport_id || group.immutable) {
    inline_tiimi_admin(req, res, next)
  }

  await tag_db.updateTagGroupName({ id: req.params.group_id, name: req.body.group_name })

  res.json('ok!')
})

router.put('/group/:group_id/show_in_tagging', user, async (req, res) => {
  if(req.body.show_in_tagging === undefined) throw new Error('bad request')

  await tag_db.updateTagGroupShowInTagging({ id: req.params.group_id, show_in_tagging: req.body.show_in_tagging })

  res.json('ok!')
})

router.put('/group/:group_id/show_in_filtering', user, async (req, res) => {
  if(req.body.show_in_filtering === undefined) throw new Error('bad request')

  await tag_db.updateTagGroupShowInFiltering({ id: req.params.group_id, show_in_filtering: req.body.show_in_filtering })

  res.json('ok!')
})

router.put('/group/:group_id/one_tag_only', user, async (req, res) => {
  if(req.body.one_tag_only === undefined) throw new Error('bad request')

  await tag_db.updateOneTagOnly({ id: req.params.group_id, one_tag_only: req.body.one_tag_only })

  res.json('ok!')
})

router.put('/:tag_id/name', user, async (req, res, next) => {
  if(!req.body.tag_name) throw new Error('bad request')

  const [ tag ] = await tag_db.tagById(req.params.tag_id)
  const [ group ] = await tag_db.groupById(tag.group_id)

  if(!tag.team_id && group.sport_id) inline_tiimi_admin(req, res, next)

  await tag_db.updateTagName({ id: req.params.tag_id, name: req.body.tag_name })

  res.json('ok!')
})

router.put('/:tag_id/map_color', user, async (req, res, next) => {
  const [ tag ] = await tag_db.tagById(req.params.tag_id)
  const [ group ] = await tag_db.groupById(tag.group_id)

  if(!tag.team_id && group.sport_id) inline_tiimi_admin(req, res, next)

  await tag_db.updateTagColor({ id: req.params.tag_id, color: req.body.map_color })

  res.json('ok!')
})

router.put('/:tag_id/hotkey', user, async (req, res, next) => {
  const [ tag ] = await tag_db.tagById(req.params.tag_id)
  const [ group ] = await tag_db.groupById(tag.group_id)

  if(!tag.team_id && group.sport_id) inline_tiimi_admin(req, res, next)

  await tag_db.updateTagHotkey({ id: req.params.tag_id, hotkey: req.body.hotkey })

  res.json('ok!')
})

router.put('/:tag_id', user, async (req, res, next) => {
  const { tag_name, map_color, hotkey } = req.body;

  if(!tag_name) throw new Error('tag_name missing')

  const [ tag ] = await tag_db.tagById(req.params.tag_id)
  const [ tag_group ] = await tag_db.tagGroupById(tag.group_id)

  if(!tag.team_id && tag_group.sport_id) inline_tiimi_admin(req, res, next)

  is_in_team(tag_group.team_id)(req)

  await tag_db.updateTag({...req.body, id: req.params.id})

  const [ updated_tag ] = await tag_db.tagById(req.params.id)

  res.json(updated_tag)
})

router.put('/group/order', user, is_in_team(), async (req, res) => {
  if(!req.body.groups || !req.body.team_id) throw new Error('bad request')

  const promises = req.body.groups.map((g, i) => {
    if(!g.sport_id) return tag_db.editGroupOrder(g.id, i)
  })

  await Promise.all(promises)

  res.json('ok!')
})

router.post('/', user, async (req, res) => {
  const { tag_name, group_id, position, map_color, hotkey, add_to_sport } = req.body

  if( !tag_name || !group_id) throw new Error('bad request')
  
  let [ group ] = await tag_db.tagGroupById(group_id)

  if(!group) throw new Error('group not found')
  if(!req.tiimio_user.currentTeamId) throw new Error('current team not found')
  if(group.league_id || add_to_sport) inline_tiimi_admin(req)

  let mirrors = await tag_db.mirroringGroups(group_id)
  mirrors = mirrors.map(m => m.tag_group_id)

  is_in_team(group.team_id)

  let add_info = await tag_db.createTag({
    tag_name,
    group_id,
    team_id: !add_to_sport ? req.tiimio_user.currentTeamId : null,
    hotkey,
    map_color,
    position: position || 0
  })

  mirrors = mirrors.map(m => {
    return tag_db.createTag({
      tag_name,
      hotkey,
      map_color,
      team_id: !add_to_sport ? req.tiimio_user.currentTeamId : null,
      group_id: m,
      original_id: add_info.insertId
    })
  })

  await Promise.all(mirrors)

  let tags = await tag_db.tagAndMirrorsById(add_info.insertId)

  if(!tags) throw new Error('tag not found :(')

  res.json(tags)
})

router.put('/group/:tag_group_id', user, async (req, res) => {
  // TODO archive mirroring too
  let [ group ] = await tag_db.tagGroupById(req.params.tag_group_id)
  if(!group) throw new Error('group not found')
  if(group.league_id || group.immutable || group.sport_id) inline_tiimi_admin(req)

  is_in_team(group.team_id)

  await tag_db.archiveGroupById({ id: req.params.tag_group_id, archived: req.body.archived })

  res.send('ok!')
})

router.put('/tag/:tag_id', user, async (req, res) => {
  let [ tag ] = await tag_db.tagById(req.params.tag_id)
  if(!tag) throw new Error('tag not found')
  let [ group ] = await tag_db.tagGroupById(tag.group_id)
  if(!group) throw new Error('group not found')
  console.log(group)
  if(group.league_id || (group.sport_id && !tag.team_id)) inline_tiimi_admin(req)

  is_in_team(group.team_id)

  await tag_db.archiveById({id: req.params.tag_id, archived: req.body.archived})

  res.send('ok!')
})



module.exports = router;