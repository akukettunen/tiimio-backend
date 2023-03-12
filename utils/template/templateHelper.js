const template_db = require('../db/template')
const rule_db = require('../db/rule')

const getTemplateById = async (id, video_id) => {
  const [template] = await template_db.byId(id)
  const items = await template_db.itemsByButtonTemplateId(id)
  const form_items = await template_db.formItemsByButtonTemplateId(id)
  const rules = await rule_db.rulesByTemplateId(id)
  let answers
  if(video_id) answers = await template_db.answersByVideoId(video_id)

  return {
    ...template,
    items,
    form_items,
    rules,
    answers
  }
}

module.exports = { getTemplateById }