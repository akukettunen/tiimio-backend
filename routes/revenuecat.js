require('dotenv').config()

const stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);
const { user, is_in_team } = require('../middleware/authMiddleware');
const express = require('express');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      stripeHelper = require('../utils/stripe')
      video_db = require('../utils/db/video')
      team_db = require('../utils/db/team')
      user_db = require('../utils/db/user')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      mail = require('../utils/email/mailchimp')
      //TODO
      // const endpointSecret = 'whsec_Wlnv0c0BiANLlcX3ApAyVCSphmLCkMTT'

router.post('/webhooks', (req, res) => {
  console.log(req.body)

  res.send("ok!")
})

module.exports = router;