const { query } = require('./index.js')

const userTeams = email => {
  return query(`
    SELECT team.created, email, team.id, join_code, league_admin, league_id, 
           league_name, team.sport_id, sport_name, team_admin, team_id,
           team_name, user_joined_team 
    FROM user_team
    LEFT JOIN team ON user_team.team_id = team.id
    LEFT JOIN league ON team.league_id = league.id
    LEFT JOIN sport ON team.sport_id = sport.id
    WHERE user_team.email = ?;
  `, [email])
}

const userTeamByEmailAndTeamId = ({ email, team_id }) => {
  console.log(email, team_id)
  return query(`
    SELECT * FROM user_team
    WHERE email = ? AND team_id = ?;
  `, [ email, team_id ])
}

const userTeamStripeId = ({ team_id, email }) => {
  return query(`
    SELECT stripe_id FROM user_team
    WHERE team_id = ? AND email = ?;
  `, [team_id, email])
}

module.exports = { userTeams, userTeamStripeId, userTeamByEmailAndTeamId }