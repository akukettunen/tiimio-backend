const { user, is_in_team } = require('../middleware/authMiddleware')
const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      user_db = require('../utils/db/user')
      team_db = require('../utils/db/team')
      filter_db = require('../utils/db/filter')
      stripe = require('../utils/stripe/index')
      userHelper = require('../utils/user/userHelper')
      clipHelper = require('../utils/clip/clipHelper')
      require('express-async-errors');

router.post('/', user, async (req, res) => {
  is_in_team()

  const { title, description, videos, tags, include_videos, search_games, include_clips, include_times } = req.body;

  if(!title) throw new Error('bad request')
  if(!include_videos && !include_clips && !include_times) throw new Error('bad request')

  const addData = await filter_db.addFilter(req.body);
  const [ filter ] = await filter_db.byId(addData.insertId)
  await filter_db.batchAddFilterParamClip(addData.insertId, tags.flat())
  if(videos && videos.length) await filter_db.batchAddFilterParamVideo(addData.insertId, videos)
  
  res.json(filter)
})

router.get('/:id/clip', user, async (req, res) => {
  let [ filter ] = await filter_db.byId(req.params.id)
  let { limit, index } = req.query

  if(!filter) throw new Error('filter not found :(')
  if(!filter.team_id) throw new Error('bad request')

  let filterTagsIds = await filter_db.filterTagIds(filter.id)
  filterTagsIds = filterTagsIds.map(t => t.tag_id)
  
  let groups;
  let tags;
  if(!filter.search_games) {
    groups = await tag_db.teamGroupsIds(filter.team_id)
    tags = await tag_db.teamTagsIdsFilter(filter.team_id, filterTagsIds)
  } else {
    groups = await tag_db.leagueGroupsIds(filter.league_id)
    tags = await tag_db.leagueTagsIdsFilter(filter.league_id, filterTagsIds)
  }

  groups.forEach((group, i) => {
    groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id)
  })

  is_in_team(filter.team_id)

  let filterVideoIds = await filter_db.filterVideoIds(filter.id)
  filterVideoIds = filterVideoIds.map(v => v.video_id || v.game_id)
 
  let videos;
  if(!filterVideoIds || !filterVideoIds.length) {
    // all videos so let's get them
    if(!filter.search_games) videos = await video_db.teamVideosLimits(filter.team_id, Number(index), Number(limit))
    else videos = await video_db.leagueGamesLimits(filter.league_id, Number(index), Number(limit))
  } else {
    if(!filter.search_games) videos = await video_db.teamVideosByIdsLimits(filter.team_id, filterVideoIds, Number(index), Number(limit))
    else videos = await video_db.teamVideosByIdsLimits(filter.league_id, filterVideoIds, Number(index), Number(limit))
  }

  // videos = videos.map(video => video.id)
  let clipsPromises = videos.map(video => {
    return clipHelper.videoClips(video, groups)
  })

  let allClips = await Promise.all(clipsPromises)

  res.json({ filter, clips: allClips })
  // let db_groups = await tag_db.teamGroups(req.params.team_id)
  // let db_tags = await tag_db.teamTags(req.params.team_id)

  // let grouped_tags = []
  // db_groups.forEach(group => {
  //   let group = tags.filter(id => group)
  // })
})

router.put('/:id', user, async (req, res) => {
  is_in_team()

  if(!req.body.title) throw new Error('bad request')
  
  await filter_db.updateTitle(req.body.id, req.body.title)

  const [ filter ] = await filter_db.byId(req.body.id)

  res.json(filter)
})

router.delete('/:id', user, async (req, res) => {
  const [ filter ] = await filter_db.byId(req.params.id)

  is_in_team(filter.team_id)

  await filter_db.deleteById(filter.id)
  
  res.send('ok!')
})

router.get('/team/:team_id', user, async (req, res) => {
  is_in_team()

  const filters = await filter_db.teamFilters(req.params.team_id)

  res.json(filters)
})

module.exports = router;