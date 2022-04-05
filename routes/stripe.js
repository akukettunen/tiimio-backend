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
      //TODO
      // const endpointSecret = 'whsec_Wlnv0c0BiANLlcX3ApAyVCSphmLCkMTT'

router.post('/create-customer-portal-session', user, async (req, res) => {

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
    return_url: process.env.FRONTEND_BASE_URL + '/#/refresh',
  });

  res.json({
    url: session.url
  });
})

router.post('/create-checkout-session', user, async (req, res) => {
  // const prices = await stripe.prices.list({
  //   lookup_keys: [req.body.lookup_key],
  //   expand: ['data.product'],
  // });
  if(!req.body.team_id) throw new Error('team_id missing')
  let success_url = process.env.FRONTEND_BASE_URL + '/#/refresh?session_id={CHECKOUT_SESSION_ID}';
  let cancel_url = process.env.FRONTEND_BASE_URL + '/#/videos';

  let [ user_team ] = await team_db.userTeamByEmailAndTeamId({
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
        quantity: 1
      },
    ],
    // todo ??
    customer: user_team.stripe_id,
    mode: 'subscription',
    success_url: success_url,
    cancel_url: cancel_url,
    'customer_update[address]': 'auto',
    automatic_tax: {enabled: true}
  });

  res.json({ url: session.url });
})

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const event = req.body
  // console.log(event.data.object.items.data[0].price)
  let customer_stripe_id = event.data.object.customer
  let [ userTeam ] = await team_db.userTeamByStripeId(customer_stripe_id)
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
  console.log(event.type)

  res.send('ok!')
  switch(event.type) {
    // tilausta jatkettu tai peruutettu
    case 'customer.subscription.updated':
      // tämä kertoo loppuuko tilaus
      // console.log(event.data.object.cancel_at_period_end)

      // tämä ketoo milloin tilaus loppuu
      // console.log(event.data.object.cancel_at)

      // tämä on uusi tilaus
      // console.log(event.data.object.items.data[0].price)

      let [ plan ] = await team_db.planByStripeId(event.data.object.items.data[0].price.id)
      await team_db.changeTeamPlan({
        team_id: userTeam.team_id,
        plan_id: plan.id
      })
      break;
    // tilaus loppui
    case 'customer.subscription.deleted':
      await team_db.changeTeamPlan({
        team_id: userTeam.team_id
      })
      break;
    default:
      break;
  }
})

router.get('/team/:id', async (req, res) => {
  // TODO: vain oman joukkueen videod
  let videos = await video_db.teamVideos(req.params.id)
  res.send(videos)
})

router.get('/session/:session_id', user, async (req, res) => {
  let session = await stripeHelper.sessionById(req.params.session_id)

  res.json(session)
})

module.exports = router;