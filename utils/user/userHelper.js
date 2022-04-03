const team_db = require('../db/team')

const createUserData = async (currentTeamId, user) => {
  const email = user.email

  // get users teams from db
  let teams = await team_db.userTeams(email)
  let teamIds = teams.map(t => t.id)
  let isInRequestedTeam = teamIds.includes(Number(currentTeamId))

  currentTeamId = currentTeamId || teamIds[0]

  // parses the teams joincode away if the user isnt an admin
  teams = teams.map(team => {
    if(!team.team_admin) delete team.join_code
    return team
  })

  teams = teams.map(t => {
    if(t.id == currentTeamId) return t
    else return { id: t.id, team_name: t.team_name }
  })

  // combines the user, their team data and their chosen teamId
  if(isInRequestedTeam) {
    user = { ...user, teams, currentTeamId }
  } else if(teams.length > 0) {
    user = { 
      ...user, 
      teams, 
      currentTeamId: teamIds[0]
    }
  } else {
    user = { ...user, teams, currentTeamId: null }
  }

  return user
}

module.exports = { createUserData }