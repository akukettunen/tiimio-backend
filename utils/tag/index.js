const tag_db = require('../db/tag')
const team_db = require('../db/team')

const getTeamTagGroups = async id => {
  // Get team data for sport_id
  let [ team ] = await team_db.teamById(id)

  // Get teams tags and handle them
  let groups = await tag_db.teamGroups(id)

  // let sport_groups = await tag_db.sportGroups(team.sport_id)  
  // groups = groups.concat(sport_groups)

  let mirrors = await tag_db.teamMirrors(id)
  let tags = await tag_db.teamTags(id)
  // let sportTags = await tag_db.teamSportTags(team.sport_id, team.id)
  // tags = tags.concat(sportTags)

  groups.forEach((group, i) => {
    groups[i] = {...group, mirrors: mirrors.filter(m => m.tag_group_id == group.id)}
  })
  groups.forEach((group, i) => {
    groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id)
  })

  // // Get sport tags
  // const sport_id = team.sport_id
  // const sport_tag_groups = sport_id ? await getSportTagGroups(sport_id) : []

  return groups
}

const teamTagGroupIds = async team_id => {
  let [ team ] = await team_db.teamById(team_id)

  let groups = await tag_db.teamGroups(team_id)
  let sport_groups = await tag_db.sportGroups(team.sport_id)
  let all = groups.concat(sport_groups)

  return all
}

const getSportTagGroups = async id => {
  console.log(id)
  let groups = await tag_db.sportGroups(id)
  let mirrors = await tag_db.sportMirrors(id)
  let tags = await tag_db.sportTags(id)

  groups.forEach((group, i) => {
    groups[i] = {...group, mirrors: mirrors.filter(m => m.tag_group_id == group.id)}
  })

  groups.forEach((group, i) => {
    groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id && !tag.team_id)
  })

  return groups
}

// admins only
const handleSportGroupAdd = async (group_name, sport_id) => {
  var group_name = group_name
  // When a sportgroup is added we should
  // 1. Add it for teams that don't have it
  // 2. For teams that have a group named that, make it immutable

  // Get teams that dont have 
  const teamsWithout = await team_db.teamsBySportIdThatDontHaveGroupNamed(sport_id, group_name)
  const teamsWith = await team_db.teamsBySportIdThatHaveGroupNamed(sport_id, group_name)

  const addPromises = teamsWithout.map(t => {
    let teamId = t.team_id
    // Return promise of adding the group for the team
    return tag_db.batchAddGroups([group_name], teamId, true)
  })

  const makeImmutablePromises = teamsWith.map(t => {
    let groupId = t.id

    return tag_db.putGroupImmutability(groupId, true)
  })

  await Promise.all(addPromises)
  await Promise.all(makeImmutablePromises)
}

const handleSportGroupRemove = async (group_name, original_group_id, sport_id) => {
  // When a sportgroup is removed we should make it mutable for teams that have it
  // or if the tags in it are the same as default, remove it

  const teamsWith = await team_db.teamsBySportIdThatHaveGroupNamed(sport_id, group_name)
  let ogTags = await tag_db.tagsInGroup(original_group_id)

  const promises = teamsWith.map(team => {
    return new Promise(async (resolve, reject) => {
      const group_id = team.id

      let teamsTagsInThisGroup
      try {
        teamsTagsInThisGroup = await tag_db.tagsInGroup(group_id)
      } catch(e) {
        reject(e)
        return
      }

      if(tagsArrsAreTheSame(ogTags, teamsTagsInThisGroup) || !teamsTagsInThisGroup.length) {
        try {
          await tag_db.deleteGroupById(group_id)
        } catch(e) {
          reject(e)
          return
        }
      } else {
        try {
          await tag_db.putGroupImmutability(group_id, false)
        } catch(e) {
          reject(e)
        }
      }

      resolve()
    })
  })

  return Promise.all([promises])
}

const tagsArrsAreTheSame = (arr1, arr2) => {
  arr1 = arr1.map(t => t.tag_name)
  arr2 = arr2.map(t => t.tag_name)

  arr1.forEach(name => {
    let isInOther = arr2.find(t => t == name)
    if(isInOther) {
      arr1 = arr1.filter(a => a != name)
      arr2 = arr2.filter(a => a != name)
    }
  })

  return !arr1.length && !arr2.length
}

const getLeagueTagGroups = async id => {
  let groups = await tag_db.leagueGroups(id)
  let mirrors = await tag_db.leagueMirrors(id)
  let tags = await tag_db.leagueTags(id)

  groups.forEach((group, i) => {
    groups[i] = {...group, mirrors: mirrors.filter(m => m.tag_group_id == group.id)}
  })

  groups.forEach((group, i) => {
    groups[i]['tags'] = tags.filter(tag => tag.group_id == group.id)
  })

  return groups
}

const groupById = async group_id => {
  let [ group ] = await tag_db.groupById(group_id)
  let mirrors = await tag_db.groupMirrors(group_id)
  let tags = await tag_db.groupTags(group_id)
  group.show_in_join_w_group_tags = JSON.parse(group.show_in_join_w_group_tags)
  group.show_in_join_w_group_tags = group.show_in_join_w_group_tags.filter(t => t != null)
  return {...group, mirrors, tags}
}

module.exports = { teamTagGroupIds, handleSportGroupRemove, handleSportGroupAdd, getSportTagGroups, getLeagueTagGroups, getTeamTagGroups, groupById }