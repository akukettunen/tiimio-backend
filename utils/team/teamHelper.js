const team_db = require('../db/team')
const tag_db = require('../db/tag')
const mail = require('../email/mailchimp')
const { batchAddTag } = require('../db/time')
initialValues = require('./initialValues')


const cancelTeamPlan = async (user_id, team_id) => {
  await team_db.changeTeamPlan({
    team_id,
    plan_id: 1
  })

  return
}

const handleChangeTeamPlan = async (user_id, team_id, plan) => {
  await team_db.changeTeamPlan({
    team_id,
    plan_id: plan.id
  })

  return
}

const generateJoinCode = async (num = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPRSTUVX1234567890'
  let code = ''

  for(let i = 0; i < num; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  const [ team ] = await team_db.teamByJoinCode(code)

  if(team) return await generateJoinCode()
  return code
}

const addInitialTags = async (team_id, sport_id) => {
  // gets all columns
  let groups = await tag_db.sportGroups(sport_id)
  let og_groups = groups
  group_names = groups.map(g => g.group_name)

  const group_id_array = groups.map(g => g.id)
  if(!groups || !groups.length) return 

  // Should add the whole ting you know
  groups = groups.map(g => {
    return [
      team_id,
      g.group_name,
      g.show_in_filtering,
      g.show_in_tagging,
      g.position,
      g.one_tag_only,
      g.buffer_start,
      g.buffer_end,
      g.action_type,
      g.enduring
    ]
  })
  if(groups && groups.length) await tag_db.batchAddGroupsAll([groups])
  let teamGroups = await tag_db.teamGroups(team_id)

  // gets all columns
  const initialTags = await tag_db.tagsInGroups(sport_id, group_id_array)

  let tagPromises = teamGroups.map(group => {
    let originalGroupId = og_groups.find(f => f.group_name == group.group_name)?.id

    // adds tag_name group_id map_color hotkey and archived
    let tags = initialTags.filter(t => t.group_id == originalGroupId)

    tags = tags.map(tag => {
      return [
        group.id,
        tag.position,
        tag.tag_name,
        tag.map_color,
        tag.hotkey,
        tag.keep_chosen
      ]
    })

    if(tags && tags.length) return tag_db.batchAddTagsComplex([tags])
    else return 1
  })

  await Promise.all(tagPromises)
}

module.exports = { generateJoinCode, addInitialTags, cancelTeamPlan, handleChangeTeamPlan }