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
      sport_db = require('../utils/db/sport')

router.get('/', async (req, res) => {
  const sports = await sport_db.getSports()

  res.json(sports)
})

module.exports = router;