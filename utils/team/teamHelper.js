const team_db = require('../db/team')
const tag_db = require('../db/tag')
const { batchAddTag } = require('../db/time')
initialValues = require('./initialValues')

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
  const initial = initialValues[sport_id]()

  console.log(initial)

  const groups = initial['tags'].map(g => g.name)
  await tag_db.batchAddGroups(groups, team_id)

  let teamGroups = await tag_db.teamGroups(team_id)
  console.log(teamGroups)
  let tagPromises = teamGroups.map(group => {
    let tags = initial['tags'].find(g => g.name == group.group_name)['tags']
    return tag_db.batchAddTags(group.id, tags)
  })

  await Promise.all(tagPromises)
}

module.exports = { generateJoinCode, addInitialTags }