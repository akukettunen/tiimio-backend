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
      jws = require('jws')
      //TODO
      // const endpointSecret = 'whsec_Wlnv0c0BiANLlcX3ApAyVCSphmLCkMTT'

router.post('/webhooks', async (req, res) => {
  const signature = req.body.signedPayload
  if(!signature) throw new Error('no signed payload found')

  const { payload } = jws.decode(signature)
  const parsed_payload = JSON.parse(payload)
  const transaction_info = jws.decode(parsed_payload.data.signedTransactionInfo)

  const type = parsed_payload.notificationType // DID_CHANGE_RENEWAL_PREF || DID_FAIL_TO_RENEW
  const subtype = parsed_payload.subtype
  const product_ios_id = JSON.parse(transaction_info.payload).productId

  const team_id = 119

  switch(type) {
    case 'DID_CHANGE_RENEWAL_PREF':
      // Vaihtoi tilausta, pitäisi kaivaa että mihin!
      if(subtype == "upgrade") {
        let [ new_plan ] = await team_db.planByStripeId(product_ios_id)

        await team_db.changeTeamPlan({
          team_id,
          plan_id: new_plan.id
        })
      }
      break;
    case 'DID_FAIL_TO_RENEW':
      // Jos !subtype - voi perua
      if(subtype) return
      await teamHelper.cancelTeamPlan(userTeam.email, userTeam.team_id)
      break;
    case 'DID_RENEW':
      // Pitää vaihtaa
      let [ new_plan2 ] = await team_db.planByStripeId(product_ios_id)
      await team_db.changeTeamPlan({
        team_id,
        plan_id: new_plan2.id
      })
      break;
    case 'EXPIRED':
      // Voipi perua
      await teamHelper.cancelTeamPlan(userTeam.email, userTeam.team_id)
      break;
    case 'GRACE_PERIOD_EXPIRED':
      // Voipi perua
      await teamHelper.cancelTeamPlan(userTeam.email, userTeam.team_id)
      break;
    case 'SUBSCRIBED':
      // Tilasi
      let [ new_plan3 ] = await team_db.planByStripeId(product_ios_id)
      await team_db.changeTeamPlan({
        team_id,
        plan_id: new_plan3.id
      })
      break;
    default:
      break;
  }

  const renewal_info = jws.decode(parsed_payload.data.signedRenewalInfo)
  console.log(renewal_info.payload)

  res.send("ok!")
})

module.exports = router;