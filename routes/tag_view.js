const express = require('express');
      router = express.Router()
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      tag_db = require('../utils/db/tag_view')
      tagHelper = require('../utils/tag')
      require('express-async-errors');
      const { user, is_in_team, tiimi_admin, inline_is_in_team, inline_tiimi_admin } = require('../middleware/authMiddleware');

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

// router.post('/', user, (req, res) => {

// })

module.exports = router;