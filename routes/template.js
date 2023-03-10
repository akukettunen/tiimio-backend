const express = require('express')
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      clip_db = require('../utils/db/clip')
      rule_db = require('../utils/db/rule')
      template_db = require('../utils/db/template')
      templateHelper = require('../utils/template/templateHelper')
      require('express-async-errors');
      const { user, is_in_team, tiimi_admin } = require('../middleware/authMiddleware');

router.post('/sport/:sport_id', tiimi_admin, async (req, res) => {
  const { id, template_name, save_on_map_click, save_on_tag_click, immutable, team_id, sport_id, rules, form_items, items, tag_ig, tag_group_id } = req.body;

  if(id) {
    await template_db.deleteTemplate(id)
  }

  // Validate the request body
  if(!template_name) throw new Error('template name misssing')

  if (save_on_map_click == null || save_on_tag_click == null || immutable == null) {
    throw new Error('bad request')
  }

  const { insertId } = await template_db.postTemplate(req.body)
  const rule_vals = rules.map((r, index) => { return {...r, position: index}})
  if(rule_vals && rule_vals.length) await rule_db.saveSportRules({ rules: rule_vals, button_template_id: insertId })

  // Transform the array of button template items into a 2D array for the SQL query
  const values = items.map(item => [
    insertId,
    item.type,
    item.text,
    item.w,
    item.h,
    item.x,
    item.y,
    item.justifyContent,
    item.fontSize,
    item.backgroundColor,
    item.textColor,
    item.activeBackgroundColor,
    item.activeTextColor,
    item.showGroupName,
    item.tag_name,
    item.tag_group_name,
    item.map_base_id,
    item.map_base_url,
    item.tag_id, 
    item.tag_group_id
  ]);

  const form_item_values = form_items.map((question) => [
    question.position,
    question.title,
    insertId,
    question.tag_group_id,
  ]);

  if(values && values.length) await template_db.postTemplateItems({ items: values })
  if(form_item_values && form_item_values.length) await template_db.postTemplateFormItems({ items: form_item_values })

  res.json(req.body)
})

router.get('/:id', user, async (req, res) => {
  const template = await templateHelper.getTemplateById(req.params.id)

  res.json(template)
})

router.get('/sport/:sport_id', user, async (req, res) => {
  const templates = await template_db.sportTemplates(req.params.sport_id)

  const promises = templates.map(t => {
    return templateHelper.getTemplateById(t.id)
  })

  const ret = await Promise.all(promises)

  res.json(ret)
})

router.delete('/:id', tiimi_admin, async (req, res) => {
  const buttonTemplateId = req.params.id;

  // Delete the button template from the database
  await template_db.deleteTemplate(buttonTemplateId)

  res.status(204).send('ok!')
});

module.exports = router;