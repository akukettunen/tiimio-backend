require('dotenv').config()
const express = require('express');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcrypt');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      video_db = require('../utils/db/video')
      team_db = require('../utils/db/team')
      user_db = require('../utils/db/user')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);

router.post('/create-customer-portal-session', async (req, res) => {

  const [ user ] = await user_db.getUserByEmail(req.tiimio_user.email)
  const team_id = req.body.team_id

  // TODO check if user in fact is in team

  const [ stripe_id ] = await team_db.userTeamStripeId({
    team_id: team_id,
    email: user.email
  })

  // Authenticate your user.
  const session = await stripe.billingPortal.sessions.create({
    customer: stripe_id.stripe_id,
    return_url: 'http://localhost:8080/jea',
  });

  res.json({
    url: session.url
  });
})

router.post('/create-checkout-session', async (req, res) => {
  // const prices = await stripe.prices.list({
  //   lookup_keys: [req.body.lookup_key],
  //   expand: ['data.product'],
  // });
  if(!req.body.team_id) {
    res.status(500).send('No team_id present')
    return
  }

  let user_team = await team_db.userTeamByEmailAndTeamId({
    team_id: req.body.team_id,
    email: req.tiimio_user.email
  })

  console.log(user_team)

  if(!user_team) {
    res.status(500).send('Team not found')
    return
  }
  // console.log(prices, req.body.lookup_key)
  // TODO pitää olla joukkueen orderer
  // TODO ei saa olla muita tilauksia päällä (voidaan redirectata boardille tai sinne)

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    line_items: [
      {
        price: req.body.lookup_key,
        // For metered billing, do not pass quantity
        quantity: 1,
        
      },
    ],
    // todo ??
    customer: user_team[0].stripe_id,
    mode: 'subscription',
    success_url: `http://localhost:8080/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:8080/cancel.html`,
  });

  res.json({ url: session.url });
})

router.get('/team/:id', async (req, res) => {
  // TODO: vain oman joukkueen videod
  let videos = await video_db.teamVideos(req.params.id)
  res.send(videos)
})

module.exports = router;