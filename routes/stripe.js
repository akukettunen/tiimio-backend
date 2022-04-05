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

router.post('/customer-session-url', user, async (req, res) => {

  const [ user ] = await user_db.getUserByEmail(req.tiimio_user.email)
  const team_id = req.body.team_id

  if(!team_id) throw new Error('team_id missing')

  // TODO check if user in fact is in team
  const [ userTeam ] = await team_db.userTeamStripeId({
    team_id: team_id,
    email: user.email
  })
  
  // returns uncancelled subscriptions
  const subscriptions_object = await stripeHelper.customerSubscriptionsById(userTeam.stripe_id)
  const num_of_subscriptions = subscriptions_object.data.length

  let session
  if(num_of_subscriptions > 0 || !req.body.lookup_key) {
    session = await stripeHelper.portalSessionUrlByStripeId(userTeam.stripe_id)
  } else {
    session = await stripeHelper.checkoutSessionUrlByStripeId(userTeam.stripe_id, req.body.lookup_key)
  }

  res.json({
    url: session.url
  });
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