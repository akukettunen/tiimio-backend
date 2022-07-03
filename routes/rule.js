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
const { deleteById } = require('../utils/db/tag');

// router.post('/batch', user, async (req, res) => {
//   const email = req.tiimio_user['email']
//   console.log(req.body)
//   const promises = req.body.map(r => {
//     // r = {
//     //   ...r,
//     //   if_rule: JSON.stringify(r.if_rule),
//     //   then_rule: JSON.stringify(r.then_rule)
//     // }

//     return rule_db.saveRule(r, email)
//   })

//   await Promise.all(promises)

//   const rules = await rule_db.userRules(req.tiimio_user.email)

//   res.json(rules)
// })

router.post('/team/:team_id', user, async (req, res) => {
  is_in_team()
  let rule = req.body
  rule = { ...rule, team_id: req.params.team_id}

  const insertData = await rule_db.saveTeamRule(rule)
  const [saved_rule] = await rule_db.byId(insertData.insertId)

  res.json(saved_rule)
})

router.get('/team/:team_id', user, async (req, res) => {
  is_in_team()
  
  let rules = await rule_db.teamRules(req.params.team_id)

  res.json(rules)
})

router.delete('/:id', user, async (req, res) => {
  const [rule] = await rule_db.byId(req.params.id)

  if(!rule) throw new Error('rule not found')

  is_in_team(rule.team_id) 

  await rule_db.deleteById(rule.id)

  res.json('ok!')
})

router.put('/:id', user, async (req, res) => {
  let { rule } = req.body
  if(!rule) throw new Error('empty rule')
  console.log(req.body)
  const insertData = await rule_db.putRule({...req.body, id: req.params.id})

  const [saved_rule] = await rule_db.byId(req.params.id)
  console.log(saved_rule)
  res.json(saved_rule)
})

router.put('/active/:id', user, async (req, res) => {
  let { active } = req.body;

  if(active === undefined) throw new Error('bad request')

  await rule_db.setActive({ active, id: req.params.id })

  const [saved_rule] = await rule_db.byId(req.params.id)

  res.json({...saved_rule, active})
})

module.exports = router;