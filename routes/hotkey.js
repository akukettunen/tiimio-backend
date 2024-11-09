const express = require('express');
      router = express.Router()
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      hotkey_db = require('../utils/db/hotkey')
      tagHelper = require('../utils/tag')
      require('express-async-errors')
      const { user, is_in_team, inline_is_in_league_or_admin, inline_is_in_team, inline_aku_kettunen, inline_tiimi_admin, tiimi_admin } = require('../middleware/authMiddleware');

// TEAM
router.get('/team/:team_id', user, async (req, res) => {
  const { team_id } = req.params;

  inline_is_in_team(team_id, req)

  const hotkeys = await hotkey_db.teamHotkeys(team_id)

  res.json(hotkeys)
})

router.get('league/:league_id', tiimi_admin, async (req, res) => {
  const { league_id } = req.params;

  const hotkeys = await hotkey_db.leagueHotkeys(league_id)

  res.json(hotkeys)
})

// TEAM
router.put('/:id', user, async (req, res) => {
  const { id } = req.params;
  const { hotkey, shift } = req.body;

  const [ hotkey_received ] = await hotkey_db.hotkeyById(id)

  if(!hotkey_received) {
    throw new Error('Hotkey not found')
  }

  inline_is_in_team(hotkey_received.team_id, req)

  await hotkey_db.updateHotkey(id, hotkey, shift)

  const return_data = { ...hotkey_received, hotkey, shift }

  res.json(return_data)
})

router.delete('/:id', user, async (req, res) => {
  const { id } = req.params;

  const [ hotkey ] = await hotkey_db.hotkeyById(id)

  if(!hotkey) {
    throw new Error('Hotkey not found')
  }

  inline_is_in_team(hotkey.team_id, req)

  await hotkey_db.deleteHotkey(id, hotkey.team_id)

  res.json({ success: true })
})

module.exports = router;