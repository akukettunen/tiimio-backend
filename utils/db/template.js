const { query } = require('./index.js')

const postTemplate = ({ template_name, save_on_map_click, save_on_tag_click, immutable, team_id, sport_id }) => {
  return query(`
    INSERT INTO button_template (template_name, save_on_map_click, save_on_tag_click, immutable, team_id, sport_id) 
    VALUES (?, ?, ?, ?, ?, ?);
  `, [template_name, save_on_map_click, save_on_tag_click, immutable, team_id, sport_id])
}

const byId = (id) => {
  return query(`
    SELECT * FROM button_template
    WHERE id = ?;
  `, [id])
}

const itemsByButtonTemplateId = (id) => {
  return query(`
    SELECT * FROM button_template_item
    WHERE button_template_id = ?;
  `, [id])
}

const formItemsByButtonTemplateId = (id) => {
  return query(`
    SELECT * FROM button_template_prequisite_question
    WHERE button_template_id = ?;
  `, [id])
}

const postTemplateItems = ({ items }) => {
  return query(`
    INSERT INTO button_template_item (button_template_id, type, text, w, h, x, y, justifyContent, fontSize, backgroundColor, textColor, activeBackgroundColor, activeTextColor, showGroupName, tag_name, tag_group_name, map_base_id, map_base_url, tag_id, tag_group_id)
      VALUES ?;
  `, [items])
}

const postTemplateFormItems = ({ items }) => {
  return query(`
    INSERT INTO button_template_prequisite_question (position, title, button_template_id, tag_group_id)
    VALUES ?;
  `, [items])
}

const deleteTemplate = (id) => {
  return query(`
    DELETE FROM button_template WHERE id = ?;
  `, [id])
}

const sportTemplates = (id) => {
  return query(`
    SELECT * FROM button_template 
    WHERE sport_id = ?;
  `, [id])
}

module.exports = { formItemsByButtonTemplateId, itemsByButtonTemplateId, byId, postTemplateFormItems, postTemplateItems, sportTemplates, postTemplate, deleteTemplate }
