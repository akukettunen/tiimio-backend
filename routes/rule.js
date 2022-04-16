const express = require('express');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      tag_db = require('../utils/db/tag')
      rule_db = require('../utils/db/rule')
      stripe = require('../utils/stripe/index')
      tagHelper = require('../utils/tag')
      require('express-async-errors');
      const { user, is_in_team } = require('../middleware/authMiddleware');

router.post('/batch', user, async (req, res) => {
  const email = req.tiimio_user['email']
  console.log(req.body)
  const promises = req.body.map(r => {
    // r = {
    //   ...r,
    //   if_rule: JSON.stringify(r.if_rule),
    //   then_rule: JSON.stringify(r.then_rule)
    // }

    return rule_db.saveRule(r, email)
  })

  await Promise.all(promises)

  const rules = await rule_db.userRules(req.tiimio_user.email)

  res.json(rules)
})

router.get('/', user, async (req, res) => {
  let rules = await rule_db.userRules(req.tiimio_user.email)

  rules = rules.map(r => {
    return {
      ...r,
      if_rule: JSON.parse(r.if_rule),
      then_rule: JSON.parse(r.then_rule)
    }
  })

  res.json(rules)
})

module.exports = router;