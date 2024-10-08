const template_db = require('../db/template')
const tag_db = require('../db/tag')
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

const copySportTemplatesToTeam = async (sport_id, team_id) => {
  // templates
  const templates = await template_db.sportTemplates(sport_id)

  // template items
  const items = await template_db.sportTemplateItems(sport_id)

  const promises = templates.map(template => {
    return new Promise(async (resolve, reject) => {
      // save template its items and its rules
      // save template and get its id
      const id = template.id
      template['id'] = null
      template['team_id'] = team_id
      template['sport_id'] = null

      const { insertId } = await template_db.postTemplate(template)

      // promises for modifying the items
      try {
        template_items_promises = items.filter(i => i.button_template_id == id).map(i => {
          return new Promise(async (resolve, reject) => {
            let tag_group_id;
            let tag_id;
            try {
              if(i.tag_id) {
                let [ res ] = await tag_db.tagIdByNameAndTeamId({ name: i.tag_name, team_id })
                tag_id = res?.id
              } else if(i.tag_group_id) {
                let [ res ] = await tag_db.tagGroupIdByNameAndTeamId({ name: i.tag_group_name, team_id })
                tag_group_id = res?.id
              }
            } catch(e) {
              reject(e)
            }

            resolve({
              ...i,
              button_template_id: insertId,
              tag_id,
              tag_group_id
            })
          })
        })
      } catch(e) {
        reject(e)
      }

      let new_items = await Promise.all(template_items_promises)
      const values = new_items.map(item => [
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
      ])

      resolve(await template_db.postTemplateItems({items: values}))
    })
  })

  try {
    let d = Promise.all(promises)
    return d
  } catch(e) {
    throw new Error('something went wrong :(')
  }
}

module.exports = { getTemplateById, copySportTemplatesToTeam }