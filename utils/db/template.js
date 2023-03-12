const { query } = require('./index.js')

const postTemplate = ({ template_name, save_on_map_click, save_on_tag_click, immutable, team_id, sport_id }) => {
  return query(`
    INSERT INTO button_template (template_name, save_on_map_click, save_on_tag_click, immutable, team_id, sport_id) 
    VALUES (?, ?, ?, ?, ?, ?);
  `, [template_name, save_on_map_click, save_on_tag_click, immutable, team_id, sport_id])
}

const answersByVideoId = (video_id) => {
  return query(`
    SELECT button_template_prequisite_answer.*, tag.tag_name as tag_name FROM button_template_prequisite_answer
    LEFT JOIN tag ON tag.id = button_template_prequisite_answer.tag_id
    WHERE video_id = ?;
  `, [ video_id ])
}

const postAnswers = answers => {
  return query(`
    INSERT INTO button_template_prequisite_answer ( button_template_prequisite_question_id, video_id, tag_id )
    VALUES ?;
  `, [answers])
}

const deleteAnswersByVideoId = video_id => {
  return query(`
    DELETE FROM button_template_prequisite_answer
    WHERE video_id = ?;
  `, [video_id])
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
    INSERT INTO button_template_prequisite_question (id, position, title, button_template_id, tag_group_id, multiple, add_to_event)
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

module.exports = { deleteAnswersByVideoId, postAnswers, answersByVideoId, formItemsByButtonTemplateId, itemsByButtonTemplateId, byId, postTemplateFormItems, postTemplateItems, sportTemplates, postTemplate, deleteTemplate }
