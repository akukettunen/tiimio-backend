require('dotenv')
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const { user, is_in_team, tiimi_admin } = require('../middleware/authMiddleware');
      router = express.Router()
      db = require('../utils/db/index')
      bcrypt = require('bcryptjs');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      video_db = require('../utils/db/video')
      aws = require('../utils/aws/index')
      clip_db = require('../utils/db/clip')
      time_db = require('../utils/db/time')
      maps_db = require('../utils/db/maps')
      timeHelper = require('../utils/time/timeHelper')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      ngrok = require('ngrok');
      hook_helper = require('../utils/video/hooks')
      require('express-async-errors');

router.get('/base/team/:id', user, async (req, res) => {
  const [team] = await team_db.teamById(req.params.id)
  const maps = await maps_db.sportMapBases(team.sport_id)

  res.json(maps)
})

router.get('/base/sport/:sport_id', user, async (req, res) => {
  const maps = await maps_db.sportMapBases(req.params.sport_id)
  res.json(maps)
})

router.post('/', user, async (req, res) => {
  const { title, points, map_base_id, team_id } = req.body;

  if(!title || !map_base_id || !team_id) throw new Error('bad request')
  
  is_in_team(req.body.team_id)

  const insertData = await maps_db.addMap(req.body)
  const map = await maps_db.mapById(insertData.insertId)

  const mapped_points = points.map(p => {
    return [ p.id, insertData.insertId, p.x, p.y, p.color, p.style, undefined, undefined ]
  })
  await maps_db.addMapPoint(mapped_points)

  res.json(map)
})

router.get('/:map_id', user, async (req, res) => {
  const { map_id } = req.params

  const [ map ] = await maps_db.mapById(map_id)

  if(!map) throw new Error('map not found')
  is_in_team(map.team_id)

  res.json(map)
})

router.get('/team/:team_id', user, async (req, res) => {
  is_in_team()
  const maps = await maps_db.teamMaps(req.params.team_id)

  res.json(maps)
})

router.get('/:map_id/points', user, async (req, res) => {
  const {map_id} = req.params
  const {limit} = req.query

  const map = await maps_db.mapById(map_id)

  is_in_team(map.team_id)

  const points = await maps_db.mapPoints(map_id, limit ? Number(limit) : undefined)

  res.json(points)
})

router.put('/:map_id', user, async (req, res) => {
  const { title, description, points } = req.body;
  if(points && points.length) {
    const mapped_points = points.map(p => {
      return [ Number(p.id), Number(req.params.map_id), p.x, p.y, p.color, p.style, undefined, undefined ]
    })
    await maps_db.deletePoints(Number(req.params.map_id))
    await maps_db.addMapPoint(mapped_points)
  }

  if(title) {
    const d = await maps_db.setTitle(Number(req.params.map_id), title)
  }

  if(description) {
    await maps_db.setDescription(Number(req.params.map_id), description)
  }

  const [ map ] = await maps_db.mapById(Number(req.params.map_id))
  
  res.json(map)
})

router.delete('/:map_id', user, async (req, res) => {
  const map = await maps_db.mapById(req.params.map_id)

  is_in_team(map.team_id)

  await maps_db.deleteMap(req.params.map_id)
  
  res.json('ok!')
})

router.post('/base', (req, res) => {
  
})
module.exports = router;