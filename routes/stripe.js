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
      //TODO
      const endpointSecret = 'whsec_Wlnv0c0BiANLlcX3ApAyVCSphmLCkMTT'

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
  if(!req.body.team_id) throw new Error('team_id missing')
  let success_url = req.body.success_url;
  let cancel_url = req.body.cancel_url;
  console.log(req.body)

  let user_team = await team_db.userTeamByEmailAndTeamId({
    team_id: req.body.team_id,
    email: req.tiimio_user.email
  })

  if(!user_team) throw new Error('team not found')
  // console.log(prices, req.body.lookup_key)
  // TODO pitää olla joukkueen orderer
  // TODO ei saa olla muita tilauksia päällä (voidaan redirectata boardille tai sinne)!!

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    line_items: [
      {
        price: req.body.lookup_key,
        quantity: 1,
      },
    ],
    // todo ??
    customer: user_team[0].stripe_id,
    mode: 'subscription',
    success_url: success_url || `http://localhost:8080/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancel_url || `http://localhost:8080/cancel.html`,
  });

  res.json({ url: session.url });
})

router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const event = req.body
  console.log(event.type)
  // console.log(event.data.object.items.data[0].price)
  console.log(event)

  const customer_stripe_id = event.data.object.customer

  // if (endpointSecret) {
  //   // Get the signature sent by Stripe
  //   const signature = req.headers['stripe-signature'];
  //   try {
  //     event = stripe.webhooks.constructEvent(
  //       req.body,
  //       signature,
  //       endpointSecret
  //     );
  //   } catch (err) {
  //     console.log(`⚠️  Webhook signature verification failed.`, err.message);
  //     return res.sendStatus(400);
  //   }
  // }

  res.send('ok!')
  switch(event.type) {
    // tilausta jatkettu tai peruutettu
    case 'customer.subscription.updated':
      // tämä kertoo loppuuko tilaus
      event.data.object.cancel_at_period_end

      // tämä ketoo milloin tilaus loppuu
      event.data.object.cancel_at

      // tämä on uusi tilaus
      event.data.object.items.data[0].price

    // tilaus loppui
    case 'customer.subscription.deleted':
      event.data.object
  }
})

router.get('/team/:id', async (req, res) => {
  // TODO: vain oman joukkueen videod
  let videos = await video_db.teamVideos(req.params.id)
  res.send(videos)
})

module.exports = router;