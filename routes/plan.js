const express = require('express');
const { query } = require('../utils/db/index')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcrypt')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      stripe = require('../utils/stripe/index')
      require('express-async-errors');

router.get('/', async (req, res) => {
  let plans = await query(`
    SELECT * FROM plan;
  `)

  res.json(plans)
})

module.exports = router;