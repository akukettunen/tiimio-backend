const express = require('express');
      router = express.Router()
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      hotkey_db = require('../utils/db/hotkey')
      tagHelper = require('../utils/tag')
      require('express-async-errors')
      const { user, is_in_team, inline_is_in_league_or_admin, inline_is_in_team, inline_aku_kettunen, inline_tiimi_admin } = require('../middleware/authMiddleware');

router.get('/team/:team_id', user, async (req, res) => {
  const { team_id } = req.params;

  inline_is_in_team(team_id, req)

  const hotkeys = await hotkey_db.teamHotkeys(team_id)

  res.json(hotkeys)
})

module.exports = router;