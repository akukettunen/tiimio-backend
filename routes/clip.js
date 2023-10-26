const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      clip_db = require('../utils/db/clip')
      map_db = require('../utils/db/maps')
      folder_db = require('../utils/db/folder')
      clip_helper = require('../utils/clip/clipHelper')
      require('express-async-errors');
      const { user, is_in_team, tiimi_admin } = require('../middleware/authMiddleware');

router.get('/team/:team_id', async (req, res) => {
  const { index, limit } = req.query;

  const videos = await clip_db.teamClips(req.params.team_id, index, limit)

  is_in_team()

  const parsed_videos = videos.map(video => {
    return {
      ...video,
      clips: JSON.parse(video?.clips)
    }
  })
 
  res.json({ videos: parsed_videos })
})

router.get('/:id/graphics', async (req, res) => {
  const { Item } = await clip_db.getClipGraphics(req.params.id)
  console.log(Item?.Item)
  res.json( Item?.Item )
})

router.get('/:id', user, async (req, res) => {
  const [raw_clip] = await clip_db.clipById(req.params.id)
  const clip = await clip_helper.clipById(req.params.id, raw_clip?.game_id)

  is_in_team(clip.video_id)

  res.json(clip)
})

router.put('/:clip_id/title', user, async (req, res) => {
  const [ clip ] = await clip_db.clipAndVideoByClipId(req.params.clip_id)

  if(!req.body.title) throw new Error('bad request')
  is_in_team(clip.team_id)

  await clip_db.putClipTitle({ id: req.params.clip_id, title: req.body.title })
  const updatedClip = await clip_helper.clipById(req.params.clip_id)

  res.json(updatedClip)
})

router.put('/:clip_id/graphics', user, async (req, res) => {
  const [ clip ] = await clip_db.clipAndVideoByClipId(req.params.clip_id)
  if(!req.body.graphics) throw new Error('bad request')
  is_in_team(clip.team_id)

  let data = await clip_db.postClipGraphics({
    clip_id: req.params.clip_id,
    Item: req.body.graphics
  })

  res.send('ok!')
})

router.put('/:clip_id/tag', user, async (req, res) => {
  const [ clip ] = await clip_db.clipAndVideoByClipId(req.params.clip_id)

  is_in_team(clip.team_id)

  const current_tags = await clip_db.clipTags(req.params.clip_id)
  const new_tags_ids = req.body.tags
  const current_tags_ids = current_tags.map(t => t.id)
  
  const addIds = new_tags_ids.filter(n => !current_tags_ids.includes(n))
  const removeIds = 
    current_tags_ids
      .filter(n => !new_tags_ids.includes(n))
      .map(t => `'${t}'`)
  
  if(addIds?.length) {
    await clip_db.batchAddTag(req.params.clip_id, addIds)
  }
  if(removeIds?.length) {
    await clip_db.batchRemoveTag(req.params.clip_id, removeIds)
  }

  const updatedClip = await clip_helper.clipById(req.params.clip_id)

  res.json(updatedClip)
})

router.put('/:time_id/tag', user, async (req, res) => {
  const [ time ] = await time_db.timeAndVideoByTimeId(req.params.time_id)

  is_in_team(time.team_id)

  const current_tags = await time_db.timeTags(req.params.time_id)
  const new_tags_ids = req.body.tags
  const current_tags_ids = current_tags.map(t => t.id)

  const addIds = new_tags_ids.filter(n => !current_tags_ids.includes(n))
  const removeIds = 
    current_tags_ids
      .filter(n => !new_tags_ids.includes(n))
      .map(t => `'${t}'`)

  if(addIds?.length) {
    await time_db.batchAddTag(req.params.time_id, addIds)
  }
  if(removeIds?.length) {
    await time_db.batchRemoveTag(req.params.time_id, removeIds)
  }

  const updatedTime = await time_helper.timeById(req.params.time_id)

  res.json(updatedTime)
})

router.post('/', user, async (req, res, next) => {
  const { title, starttime, endtime, video_id, map_color, description, tags, points, leaguewide, team_id, game_id, is_point, main_tag_id } = req.body

  if(team_id) is_in_team(team_id)
  if(!title || (!starttime && starttime !== 0) || !(video_id || (leaguewide || team_id) || (!endtime  && !is_point) ) ) throw new Error('bad request')

  if(leaguewide && !req.tiimio_user.tiimio_admin) throw new Error('authentication error')

  let added = await clip_db.addClip(req.body)

  if(points && points.length) await map_db.addMapPoint(points.map(p => [p.id, undefined, p.x, p.y, p.color, p.style, added.insertId, p.map_base.id]))
  if(tags && tags.length) await clip_db.batchAddTag(added.insertId, tags, main_tag_id)
  
  let clip = await clip_helper.clipById(added.insertId, game_id)
  if(!clip) throw new Error('added clip not found')

  res.json({...clip, num_of_tags: tags.length })
})

router.put('/:id/point', user, async (req, res) => {
  const { points } = req.body;

  if(!points || !points.length) throw new Error('bad request')

  await map_db.deleteClipPoints(req.params.id)
  await map_db.addMapPoint(points.map(p => [p.id, undefined, p.x, p.y, p.color, p.style, req.params.id, p.map_base.id]))

  let clip = await clip_helper.clipById(req.params.clip_id)

  res.json({ clip })
})

router.put('/:id/range', user, async (req, res) => {
  const { starttime, endtime } = req.body;

  if((!starttime && starttime !== 0) || !endtime) throw new Error('No starttime or endtime')

  await clip_db.putClipStarttimeEndtimeIspoint({
    starttime,
    endtime,
    is_point: false,
    clip_id: req.params.id
  })
  
  const [ clip ] = await clip_db.clipById(req.params.id)

  res.json(clip)
})

// router.put('/:id', user, async (req, res) => {
//   const id = req.params.id
//   if(!id) throw new Error('bad request')

//   const [ video ] = await clip_db.videoByClipId(id)
//   if(!video || !video.team_id) throw new Error('something bad happened :(')

//   is_in_team(video.team_id)

  
// })

router.post('/:id/folder/:folder_id', user, async (req, res) => {
  const clip_id = req.params.id
  const folder_id = req.params.folder_id
  if(!clip_id || !folder_id) throw new Error('bad request')

  const [ video ] = await clip_db.videoByClipId(clip_id)
  if(!video || !video.team_id) throw new Error('something bad happened :(')

  const [ folder ] = await folder_db.byId(folder_id)

  if(!folder || !folder.team_id) throw new Error('something bad happened :(')

  is_in_team(video.team_id)
  is_in_team(folder.team_id)

  if(video.team_id !== folder.team_id) throw new Error('bad request')

  await clip_db.addFolderObject(clip_id, folder_id)
  const [ folder_object ] = await clip_db.folderObjectById(clip_id, folder_id)

  res.json(folder_object)
})

router.delete('/:id', user, async (req, res) => {
  if(!req.params.id) throw new Error('bad request')

  const [ clip ] = await clip_db.clipById(req.params.id)

  if(!clip) throw new Error('clip not found :/')

  const [ video ] = await video_db.videoById(clip.video_id)

  if(clip.team_id && !clip.game_id) {
    is_in_team(video.team_id)
  } else {
    if(!req.tiimio_user?.tiimio_admin) throw new Error('authentication error')
  }

  await clip_db.deleteById(req.params.id)

  res.json('ok!')
})

router.post('/rule', user, async (req, res) => {
  is_in_team()

  const { rule_id } = req.body;

  let insertData
  if(rule_id) {
    await clip_db.putRule(req.body)
  } else {
    insertData = await clip_db.postRule(req.body)
  }
})



module.exports = router;