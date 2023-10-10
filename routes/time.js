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
      time_db = require('../utils/db/time')
      time_helper = require('../utils/time/timeHelper')
      team_db = require('../utils/db/team')
      video_db = require('../utils/db/video')
      user_db = require('../utils/db/user')
      folder_db = require('../utils/db/folder')

router.get('/timename/team/:team_id', user, async (req, res) => {
  if(!req.params.team_id) throw new Error('bad request')
  
  is_in_team()

  let timenames = await time_db.teamTimenames(req.params.team_id)

  res.json(timenames)
})

router.put('/timename', user, async (req, res) => {
  is_in_team()

  if(!req.body.name || !req.body.id) throw new Error('bad request')

  await time_db.updateTimename(req.body.name, req.body.hidden || false, req.body.id)

  const [timename] = await time_db.timenameById(req.body.id)

  res.json(timename)
})

router.put('/timename/order', user, async (req, res) => {
  if(!req.body.timenames || !req.body.team_id) throw new Error('bad request')

  is_in_team()

  const promises = req.body.timenames.map((t, i) => {
    return time_db.editTimenameOrder(t.id, i)
  })

  await Promise.all(promises)

  res.json('ok!')
})

router.get('/team/:team_id', async (req, res) => {
  let { page, itemsPerPage, sortBy, sortDesc, columns, tags } = req.query;
  // TODO columns will have to be sanitized

  sortBy = sortBy === 'undefined' ? undefined : sortBy
  sortDesc = sortDesc === 'true'

  columns = columns.split(',').map(t => `'${t}'`)
  const times = await time_db.teamTimes(
    Number(page),
    Number(itemsPerPage),
    sortBy,
    sortDesc,
    Number(req.params.team_id),
    columns,
    tags
  )

  const avgs = await time_db.timenameAverages(req.params.team_id, columns, tags)

  let [ total ] = await time_db.teamTotalTimes(Number(req.params.team_id), columns, tags)

  res.json({times, total: total?.amount, avgs})
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

router.post('/timename', user, async (req, res) => {
  is_in_team()

  const add = req.body

  if(!add || !add.name || !add.team_id) throw new Error('bad request')

  const addData = await time_db.addTimename(add)

  const timename = await time_db.timenameById(addData.insertId)

  res.json(timename)
})

router.post('/', user, async (req, res) => {
  const { video_id, timenames, title, tag_ids } = req.body

  if(!video_id || !timenames || !timenames.length) {
    throw new Error('bad request')
  }

  const [ video ] = await video_db.videoById(video_id)

  let largest;
  timenames.forEach(t => {
    if(!largest || largest < t.time_from_first) largest = t.time_from_first
  })

  if(!video || !video.team_id) throw new Error('something went wrong :(')

  const timeAddData = await time_db.createTime({
    video_id,
    title,
    total_in_seconds: largest
  })

  if(tag_ids?.length) await time_db.batchAddTag(timeAddData.insertId, tag_ids)
  
  await time_db.batchCreateTimeTimename(timenames, timeAddData.insertId)

  const time = await time_helper.timeById(timeAddData.insertId)

  res.json(time)
})

router.delete('/:id', user, async (req, res) => {
  if(!req.params.id) throw new Error('bad request')

  const [ time ] = await time_db.byId(req.params.id)

  if(!time) throw new Error('time not found :/')

  const [ video ] = await video_db.videoById(time.video_id)

  is_in_team(video.team_id)

  await time_db.deleteById(req.params.id)

  res.json('ok!')
})

router.get('/:id', user, async (req, res) => {
  const time = await time_helper.timeById(req.params.id)

  res.json(time)
})

module.exports = router;