const express = require('express');
      router = express.Router()
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      tag_db = require('../utils/db/tag_view')
      tagHelper = require('../utils/tag')
      require('express-async-errors');
      const { user, is_in_team, inline_is_in_league_or_admin, inline_is_in_team, inline_aku_kettunen, inline_tiimi_admin } = require('../middleware/authMiddleware');

// LEAGUE
router.get('/league/:league_id', user, async (req, res) => {
  const { league_id } = req.params;

  inline_is_in_league_or_admin(league_id, req)

  const views = await tag_db.getLeagueViews(league_id)

  const groupPromises = views.map(v => {
    return tag_db.getTagViewGroups(v.id)
  })
  let groups = await Promise.all(groupPromises)
  groups = groups.flat()

  const tagPromises = groups.map(g => {
    return tag_db.getTagGroupTags(g.id)
  })
  let tags = await Promise.all(tagPromises)
  tags = tags.flat()

  res.json({ tag_views: views, tag_groups: groups, tags })
})

// TEAM
router.get('/team/:team_id', user, async (req, res) => {
  const { team_id } = req.params;

  let default_view_created = false
  let groups_added_to_view = false

  inline_is_in_team(team_id, req)

  // Get team tag_views
  let tag_views = await tag_db.getTeamTagViews(team_id)

  // If no tag view found, create a simple view and get it
  let insertId;
  if(!tag_views || !tag_views.length) {
    insertResult = await tag_db.createDefaultView(team_id)
    insertId = insertResult.insertId
    tag_views = await tag_db.getTeamTagViews(team_id)
    default_view_created = true
  } else {
    insertId = tag_views[0].id
  }

  // Get all team tag_groups
  const tag_group_promises = tag_views.map(v => {
    return tag_db.getTagViewGroups(v.id)
  })
  let tag_groups = await Promise.all(tag_group_promises)
  tag_groups = tag_groups.flat()

  const team_tag_groups = await tag_db.teamTagGroups(team_id)
  const tag_groups_without_view = team_tag_groups.filter(g => !g.tag_view_id)

  tag_groups = tag_groups.concat(tag_groups_without_view)

  // All groups without a view, add them to the default view
  if(tag_groups_without_view && tag_groups_without_view.length) {
    groups_added_to_view = true

    await Promise.all(tag_groups_without_view.map(g => {
      return tag_db.updateTagGroup(g.id, { tag_view_id: insertId })
    }))

    tag_groups = tag_groups.map(tag_group => {
      if(!tag_group.tag_view_id) return { ...tag_group, tag_view_id: insertId }
      return tag_group
    })
  }

  // Get all team tags
  const tag_promises = tag_groups.map(g => {
    return tag_db.getTagGroupTags(g.id)
  })
  let tags = await Promise.all(tag_promises)
  tags = tags.flat()

  res.json({ tag_views, tag_groups, tags, default_view_created, groups_added_to_view, fetched_unix: Date.now() })
})

// TEAM & LEAGUE
router.post('/', user, async (req, res) => {
  const { position, tag_view_name, team_id, league_id } = req.body;

  if(league_id) inline_tiimi_admin(req)
  else inline_is_in_team(team_id, req)

  const { insertId } = await tag_db.createTagView({ position, tag_view_name, team_id, league_id })
  const [ new_tag_view ] = await tag_db.tagViewById(insertId)

  res.json(new_tag_view)
})

// TEAM & LEAGUE
router.post('/:id/group', user, is_in_team(), async (req, res, next) => {
  let { tag_view_id, position, team_id, group_name, league_id, one_tag_only, sport_id, immutable, buffer_start, buffer_end, action_type, enduring, show_in_filtering } = req.body

  if(!tag_view_id) throw new Error('tag_view_id is required')
  if(!group_name) throw new Error('bad request')

  // get tag view and check that user is in that team
  const [ tag_view ] = await tag_db.tagViewById(tag_view_id)
  if(tag_view.league_id) inline_tiimi_admin(req)
  else inline_is_in_team(tag_view.team_id, req)

  if(sport_id || league_id) inline_tiimi_admin(req)

  let { insertId } = await tag_db.createTagGroup({
    tag_view_id,
    position,
    team_id,
    group_name,
    league_id,
    one_tag_only,
    sport_id,
    immutable,
    buffer_start,
    buffer_end,
    action_type,
    enduring,
    show_in_filtering
  })
  let [ tag_group ] = await tag_db.tagGroupById(insertId)

  res.json(tag_group)
})

// TEAM & LEAGUE
router.post(`/group/:id/tag`, user, async (req, res) => {
  const { tag_name, map_shape, map_color, hotkey, position, group_id, shift } = req.body;

  if(!tag_name) throw new Error('bad request')
  const { id } = req.params;

  const [ data ] = await tag_db.teamIdByGroupId(id)
  if(!data || (!data.team_id && !data.league_id)) throw new Error('team not found')

  if(data.league_id) inline_tiimi_admin(req)
  else inline_is_in_team(data.team_id, req)

  const insertData = await tag_db.createTag({ tag_name, map_shape, map_color, hotkey, position, group_id })
  if(hotkey) {
    await tag_db.addTagHotkey({ shift: shift ? shift : false, hotkey, tag_id: insertData.insertId, team_id: data.team_id })
  }

  const tag_id = insertData.insertId

  const [ tag ] = await tag_db.tagById(tag_id)

  res.json(tag)
})

// TEAM & LEAGUE
router.patch('/order/batch', user, async (req, res) => {
  const { league_id, team_id, tag_views } = req.body;

  if(league_id) inline_tiimi_admin(req)
  else inline_is_in_team(team_id, req)

  const tag_view_promises = tag_views.map(v => {
    if(!league_id) return tag_db.updateTagViewPosition(v.id, v.position, team_id)
    else return tag_db.updateTagViewPositionLeague(v.id, v.position, league_id)
  })

  await Promise.all(tag_view_promises)

  res.json('ok')
})

// TEAM & LEAGUE
router.patch('/:tag_view_id/group/order/batch', user, async (req, res) => {
  const { tag_view_id } = req.params;
  const { groups } = req.body;

  const [ tag_view ] = await tag_db.tagViewById(tag_view_id)
  if(!tag_view) throw new Error('tag view not found')

  if(tag_view.league_id) inline_tiimi_admin(req)
  else inline_is_in_team(tag_view.team_id, req)

  const group_promises = groups.map(group => {
    return tag_db.updateGroupPosition( group.id, group.position, tag_view_id )
  })

  await Promise.all(group_promises)

  res.json('ok')
})

// TEAM & LEAGUE
router.patch('/tag/order/batch', user, async (req, res) => {
  const { group_id, tags } = req.body;

  const [ data ] = await tag_db.teamIdByGroupId(group_id)
  if(!data) throw new Error('group not found')

  if(data.league_id) inline_tiimi_admin(req)
  else inline_is_in_team(data.team_id, req)

  // We know that user has this group_id
  const tag_promises = tags.map(t => {
    return tag_db.updateTagPosition(t.id, t.position, group_id)
  })

  await Promise.all(tag_promises)

  res.json('ok')
})

// TEAM & LEAGUE
router.patch('/:id', user, async (req, res) => {
  const { id } = req.params;
  const { position, tag_view_name } = req.body;

  let updates = {}
  if(position && typeof position === 'number') updates['position'] = position;
  if(tag_view_name && typeof tag_view_name === 'string') updates['tag_view_name'] = tag_view_name;

  const [ tag_view ] = await tag_db.tagViewById(id)
  if(!tag_view) throw new Error('tag view not found')

  if(tag_view.league_id) inline_tiimi_admin(req)
  else inline_is_in_team(tag_view.team_id, req)

  await tag_db.updateTagView(id, updates)

  res.json({ ...tag_view, ...updates })
})

// TEAM & LEAGUE
router.put('/tag-group/:id', user, async (req, res) => {
  const { id } = req.params;
  const updates = {
    group_name, team_id, league_id, show_in_filtering,
    show_in_tagging, position, dropdown, show_in_join_w_group,
    one_tag_only, immutable, sport_id, buffer_start, buffer_end,
    action_type, enduring, archived, tag_view_id
  } = req.body;

  const [ tag_group ] = await tag_db.tagGroupById(id);
  if(!tag_group) throw new Error('tag group not found')
  const [ tag_view ] = await tag_db.tagViewById(tag_group.tag_view_id)

  if(tag_view.league_id) inline_tiimi_admin(req)
  else inline_is_in_team(tag_view.team_id, req)

  await tag_db.updateTagGroup(id, updates)

  res.json({ ...tag_group, ...updates })
})

// TEAM & LEAGUE
router.put('/tag/:id', user, async (req, res) => {
  const { id } = req.params;

  const [ data ] = await tag_db.teamIdByTagId(id)
  const [ tag ] = await tag_db.tagById(id)
  if(!data) throw new Error('team not found')

  if(data.league_id) inline_tiimi_admin(req)
  else inline_is_in_team(data.team_id, req)

  await tag_db.removeTagHotkey(id)

  const { tag_name, map_color, map_shape } = req.body;
  const updates =  { tag_name, map_color, map_shape }

  const { hotkey, shift } = req.body;
  const hotkey_updates = { hotkey, shift };

  await tag_db.updateTag(id, updates)
  if(hotkey) await tag_db.addTagHotkey({ tag_id: id, hotkey, shift, team_id: data.team_id })

  res.json({ ...tag, ...updates, ...hotkey_updates })
})

// TEAM & LEAGUE
router.delete('/:id', user, async (req, res) => {
  const { id } = req.params;

  const [ tag_view ] = await tag_db.tagViewById(id)
  if(!tag_view) throw new Error('tag view not found')

  if(tag_view.league_id) inline_aku_kettunen(req)
  else inline_is_in_team(tag_view.team_id, req)

  await tag_db.deleteTagView(req.params.id)

  res.json('ok')
})

// TEAM & LEAGUE
router.delete('/tag-group/:id', user, async (req, res) => {
  const { id } = req.params;

  const [ tag_group ] = await tag_db.tagGroupById(id);
  if(!tag_group) throw new Error('tag group not found')
  const [ tag_view ] = await tag_db.tagViewById(tag_group.tag_view_id)

  if(tag_view.league_id) inline_aku_kettunen(req)
  else inline_is_in_team(tag_view.team_id, req)

  await tag_db.deleteTagGroup(id)

  res.json('ok')
})

router.delete('/tag/:id', user, async (req, res) => {
  const { id } = req.params;

  const [ data ] = await tag_db.teamIdByTagId(id);
  if(!data) throw new Error('team not found')

  if(data.league_id) inline_aku_kettunen(req)
  else inline_is_in_team(data.team_id, req)

  await tag_db.deleteTag(id)

  res.json('ok')
})

module.exports = router;