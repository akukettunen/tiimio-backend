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
  await mail.addTagToUser(user_id, ['Cancelled'])

  return
}

const handleChangeTeamPlan = async (user_id, team_id, plan) => {
  await team_db.changeTeamPlan({
    team_id,
    plan_id: plan.id
  })

  if(new_plan.is_the_best) {
    await mail.addTagToUser(user_id, ['Team owner - VIP'])
  } else {
    await mail.addTagToUser(user_id, ['Team owner - Paid'])
  }

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
  console.log('te')
  let groups = await tag_db.sportGroups(sport_id)
  group_names = groups.map(g => g.group_name)

  if(!groups || !groups.length) return 

  console.log('te')

  // add initial groups for the theam and make them immutable
  if(group_names && group_names.length) await tag_db.batchAddGroups(group_names, team_id, false)
  let teamGroups = await tag_db.teamGroups(team_id)

  const initialTags = await tag_db.tagsInGroups(sport_id, groups.map(g => g.id))

  let tagPromises = teamGroups.map(group => {
    let originalGroupId = groups.find(f => f.group_name == group.group_name)?.id

    let tags = initialTags.filter(t => t.group_id == originalGroupId)
    if(tags && tags.length) return tag_db.batchAddTagsComplex(group.id, tags)
    return 1
  })

  await Promise.all(tagPromises)
}

module.exports = { generateJoinCode, addInitialTags, cancelTeamPlan, handleChangeTeamPlan }