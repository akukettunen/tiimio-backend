const tag_db = require('../db/tag')

const getTeamTagGroups = async id => {
  let groups = await tag_db.teamGroups(id)
  let mirrors = await tag_db.teamMirrors(id)
  let tags = await tag_db.teamTags(id)

  groups.forEach((group, i) => {
    groups[i] = {...group, mirrors: mirrors.filter(m => m.tag_group_id == group.id)}
  })

  groups.forEach((group, i) => {
    groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id)
  })

  return groups
}

const groupById = async group_id => {
  let [group] = await tag_db.groupById(group_id)
  let mirrors = await tag_db.groupMirrors(group_id)
  let tags = await tag_db.groupTags(group_id)

  return {...group, mirrors, tags}
}

module.exports = { getTeamTagGroups, groupById }