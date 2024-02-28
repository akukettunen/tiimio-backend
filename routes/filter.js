const { user, is_in_team, inline_is_in_team } = require('../middleware/authMiddleware')
const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      tagHelper = require('../utils/tag')
      logger = require('../utils/logger')
      user_db = require('../utils/db/user')
      team_db = require('../utils/db/team')
      filter_db = require('../utils/db/filter')
      stripe = require('../utils/stripe/index')
      userHelper = require('../utils/user/userHelper')
      clipHelper = require('../utils/clip/clipHelper')
      require('express-async-errors');

router.post('/', user, is_in_team(), async (req, res) => {
  const { title, description, videos, tags, include_videos, search_games, include_clips, include_times } = req.body;

  if(!title) throw new Error('bad request')
  if(!include_videos && !include_clips && !include_times) throw new Error('bad request')

  const addData = await filter_db.addFilter(req.body);
  const [ filter ] = await filter_db.byId(addData.insertId)
  await filter_db.batchAddFilterParamClip(addData.insertId, tags.flat())
  if(videos && videos.length) await filter_db.batchAddFilterParamVideo(addData.insertId, videos)
  
  res.json(filter)
})

// router.get('/nosave/clip', user, async (req, res) => {
//   let filterData = JSON.parse(req.query.filter)
//   let { index, limit } = req.query
//   let filter = filterData

//   let filterTagsIds = filterData.tags

//   let groups;
//   let tags;
//   if(!filter.search_games) {
//     groups = await tagHelper.teamTagGroupIds(filter.team_id)
//     tags = await tag_db.teamTagsIdsFilter(filter.team_id, filterTagsIds)
//   } else {
//     groups = await tag_db.leagueGroupsIds(filter.league_id)
//     tags = await tag_db.leagueTagsIdsFilter(filter.league_id, filterTagsIds)
//   }


//   groups.forEach((group, i) => {
//     groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id)
//   })

//   is_in_team(filter.team_id)

//   let filterVideoIds = filter.videos
 
//   let videos;
//   if(!filterVideoIds || !filterVideoIds.length) {
//     // all videos so let's get them
//     if(!filter.search_games) videos = await video_db.teamVideosLimits(filter.team_id, Number(index), Number(limit))
//     else videos = await video_db.leagueGamesLimits(filter.league_id, Number(index), Number(limit))
//   } else {
//     if(!filter.search_games) videos = await video_db.teamVideosByIdsLimits(filter.team_id, filterVideoIds, Number(index), Number(limit))
//     else videos = await video_db.teamGamesByIdsLimits(filter.league_id, filterVideoIds, Number(index), Number(limit))
//   }

//   // videos = videos.map(video => video.id)
//   let clipsPromises = videos.map(video => {
//     return clipHelper.videoClips(video, groups)
//   })

//   let allClips = await Promise.all(clipsPromises)

//   res.json({ filter, clips: allClips })
// })

router.get('/:id/clip', user, async (req, res) => {
  let nosave = req.query.nosave
  let filter;

  if(nosave) {
    filter = JSON.parse(req.query.filter)
  } else {
    [ filter ] = await filter_db.byId(req.params.id)
  }

  // get filter data
  let { limit, index } = req.query

  // if not found throw an error
  if(!filter) throw new Error('filter not found :(')
  if(!filter.team_id) throw new Error('bad request')

  let tags;
  if(!nosave) {
    // get the tags ids that we are filtering for
    tags = await filter_db.filterTags(filter.id)
  } else {
    tags = await tag_db.tagsById(filter.tags)
  }

  let groups;
  if(!filter.search_games) {
    // get tag_groups of the groups in this team and team sport
    groups = await tagHelper.teamTagGroupIds(filter.team_id)
  } else {
    groups = await tag_db.leagueGroupsIds(filter.league_id)
  }


  // add the tags to the right group
  groups.forEach((group, i) => {
    groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id)
  })

  inline_is_in_team(filter.team_id, req)

  // get ids of the videos that we want
  let filterVideos;
  let filterVideoIds;
  if(nosave) filterVideoIds = filter.videos
  else {
    filterVideos = await filter_db.filterVideoIds(filter.id)
    filterVideoIds = filterVideos.map(v => v.video_id || v.game_id )
  }

  let getVideos;
  if(!filterVideoIds || !filterVideoIds.length) {
    // all videos so let's get them
    if(!filter.search_games) getVideos = await video_db.teamVideosLimits(filter.team_id, Number(index), Number(limit))
    else getVideos = await video_db.leagueGamesLimits(filter.league_id, Number(index), Number(limit))
  } else {
    if(!filter.search_games) getVideos = await video_db.teamVideosByIdsLimits(filter.team_id, filterVideoIds, Number(index), Number(limit))
    else getVideos = await video_db.teamVideosByIdsLimits(filter.league_id, filterVideoIds, Number(index), Number(limit))
  }

  // videos = videos.map(video => video.id)
  let clipsPromises = getVideos.map(video => {
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
  if(!req.body.title) throw new Error('bad request')
  const [ old_filter ] = await filter_db.byId(req.body.id)

  inline_is_in_team(old_filter.team_id, req)

  await filter_db.updateTitle(req.body.id, req.body.title)

  const [ filter ] = await filter_db.byId(req.body.id)

  res.json(filter)
})

router.delete('/:id', user, async (req, res) => {
  const [ filter ] = await filter_db.byId(req.params.id)

  inline_is_in_team(filter.team_id, req)

  await filter_db.deleteById(filter.id)
  
  res.send('ok!')
})

router.get('/team/:team_id', user, is_in_team(), async (req, res) => {
  const filters = await filter_db.teamFilters(req.params.team_id)

  res.json(filters)
})

module.exports = router;