const { user, is_in_team, tiimi_admin } = require('../middleware/authMiddleware');
const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();
const season_db = require('../utils/db/season')

require('express-async-errors');

router.post('/', tiimi_admin, async (req, res) => {
  let { starttime, endtime, season_name, season_info, league_id } = req.body;
  // STARTTIME AND ENDTIME IN UNIX MILLISECONDS

  if(!starttime || !endtime || !season_name || !league_id) throw new Error('bad request')

  starttime = Math.round(starttime / 1000)
  endtime = Math.round(endtime / 1000)

  const insertData = await season_db.createSeason({ 
    starttime, 
    endtime, 
    season_name,
    season_info,
    league_id
  })

  const [ season ] = await season_db.getSeasonById(insertData.insertId)

  res.json(season)
})

router.patch('/:id', tiimi_admin, async (req, res) => {
  const { id } = req.params;
  const { archived, season_name } = req.body;

  let updates = {}

  if(typeof archived !== 'undefined') updates.archived = archived
  if(season_name) updates.season_name = season_name

  const [ season ] = await season_db.getSeasonById(id)
  if(!season) throw new Error('season not found')

  await season_db.updateSeason(id, updates)

  res.send({ ...season, ...updates })
})

module.exports = router;
