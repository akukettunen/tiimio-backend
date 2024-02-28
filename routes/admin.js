const { tiimi_admin } = require('../middleware/authMiddleware')
const express = require('express')
const { json } = require('body-parser')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      sport_db = require('../utils/db/sport')
      team_db = require('../utils/db/team')
      stripe = require('../utils/stripe/index')
      userHelper = require('../utils/user/userHelper')
      emailService = require('../utils/aws/email')
      crypto = require('crypto')
      require('express-async-errors');

router.get('/teams', tiimi_admin, async (req, res) => {
  const { index, limit } = req.query

  const teams = await team_db.allTeams(Number(index || 0), Number(limit || 10))

  res.json(teams)
})

router.get('/sports', tiimi_admin, async (req, res) => {
  const sports = await sport_db.allSports()

  res.json(sports)
})

module.exports = router;