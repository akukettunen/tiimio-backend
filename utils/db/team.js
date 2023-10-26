const { query } = require('./index.js')

const createTeam = ({ sportId, name, joinCode, leagueId, planId }) => {
  return query(`
    INSERT INTO team (team_name, league_id, sport_id, created, plan_id, join_code)
    VALUES (?, ?, ?, NOW(), ?, ?);
  `, [name, leagueId, sportId, planId, joinCode])
}
const userTeams = email => {
  return query(`
    SELECT email, team.id AS id, league.id as league_id, join_code, 
      league_admin, league_id, league_name, disable_times, team.sport_id, sport_name, team_admin, 
      team_name, stripe_id, plan.short_name, team_orderer, plan.full_name, 
      plan.id as plan_id, plan.upload_hours_per_month, plan.total_hours_saved, 
      plan.is_the_freemium, plan.is_the_best, users, season_start_month,
      sport.times_available as sport_times_available
    FROM user_team
    LEFT JOIN team ON user_team.team_id = team.id
    LEFT JOIN plan ON team.plan_id = plan.id
    LEFT JOIN league ON team.league_id = league.id
    LEFT JOIN sport ON team.sport_id = sport.id
    WHERE user_team.email = ?;
  `, [email])
}

const deleteUserTeam = (email, team_id) => {
  return query(`
    DELETE FROM user_team
    WHERE email = ? AND team_id = ?;
  `, [email, team_id])
}

const teamUsers = team_id => {
  return query(`
    SELECT user.email, full_name, team_admin, team_orderer, tiimio_admin, email_confirmed, joined FROM user_team
    LEFT JOIN user ON user.email = user_team.email
    WHERE team_id = ?;
  `, [team_id])
}

const teamInvites = team_id => {
  return query(`
    SELECT * FROM team_invite
    WHERE team_id = ?;
  `, [team_id])
}

const addInvites = vals => {
  return query(`
    INSERT INTO team_invite ( email, team_id, invite_code ) VALUES ?;
  `, [vals])
}

const deleteInvite = (team_id, email) => {
  return query(`
    DELETE FROM team_invite
    WHERE team_id = ? AND email = ?;
  `, [team_id, email])
}

const teamUserAmount = (team_id) => {
  return query(`
    SELECT COUNT(*) as amount
    FROM user_team WHERE team_id = ?;
  `, [team_id])
}

const userTeamByEmailAndTeamId = ({ email, team_id }) => {
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

const userTeamByStripeId = stripe_id => {
  return query(`
    SELECT * FROM user_team
    WHERE stripe_id = ?;
  `, [stripe_id])
}

const planByStripeId = id => {
  return query(`
    SELECT * FROM plan
    WHERE stripe_price_id = ?
    ORDER BY iteration DESC;
  `, [id])
}

const planByIosId = id => {
  return query(`
    SELECT * FROM plan
    WHERE apple_store_identifier = ?
    ORDER BY iteration DESC;
  `, [id])
}

const changeTeamPlan = ({team_id, plan_id}) => {
  return query(`
    UPDATE team
    SET plan_id = ?
    WHERE id = ?;
  `, [plan_id, team_id])
}

const teamByJoinCode = code => {
  return query(`
    SELECT team.*, users FROM team
    LEFT JOIN plan ON plan.id = team.plan_id
    WHERE join_code = ?;
  `, [code.toString()])
}

const teamByInviteCode = code => {
  return query(`
    SELECT team.*, users FROM team_invite
    LEFT JOIN team ON team.id = team_invite.team_id
    LEFT JOIN plan ON plan.id = team.plan_id
    WHERE team_invite.invite_code = ?;
  `, [code.toString()])
}

const allTeams = (index = 0, limit = 10) => {
  return query(`
    SELECT *, plan.id as plan_id, team.id as id FROM team
    LEFT JOIN plan ON plan.id = team.plan_id
    ORDER BY team.created
    LIMIT ?, ?;
  `, [index, limit])
}

const numOfUsersInTeam = team_id => {
  return query(`
    SELECT COUNT(*) as number_of_users FROM user_team
    WHERE team_id = ?;
  `, [team_id])
}

const teamsBySportIdThatDontHaveGroupNamed = (sport_id, group_name) => {
  return query(`
    SELECT *, team.id as team_id, tag_group.id as id FROM team
    LEFT JOIN tag_group ON team.id = tag_group.team_id AND tag_group.group_name = ?
    WHERE team.sport_id = ? AND tag_group.group_name IS NULL;
  `, [group_name, sport_id])
}

const teamsBySportIdThatHaveGroupNamed = (sport_id, group_name) => {
  return query(`
    SELECT * FROM team
    LEFT JOIN tag_group ON team.id = tag_group.team_id AND tag_group.group_name = ?
    WHERE team.sport_id = ? AND tag_group.group_name IS NOT NULL;
  `, [group_name, sport_id])
}

const teamById = id => {
  return query(`
    SELECT *, team.id as id, plan.id as plan_id, sport.times_available as sport_times_available FROM team
    LEFT JOIN plan ON plan.id = team.plan_id
    LEFT JOIN sport ON team.sport_id = sport.id
    WHERE team.id = ?;
  `, [id])
}

const addUserToTeam = ({ email, team_id, orderer, admin, stripe_id }) => {
  orderer = orderer || false
  query(`
    INSERT INTO user_team (
      email, team_id, team_admin, team_orderer, league_admin, user_joined_team, stripe_id
    ) VALUES ( ?, ?, ?, ?, false, CURDATE(), ? );
  `, [email, team_id, admin, orderer, stripe_id])
}

const changeJoinCode = (team_id, new_code) => {
  query(`
    UPDATE team
    SET join_code = ?
    WHERE id = ?;
  `, [new_code, team_id])
}

const deleteUserFromTeam = (team_id, email) => {
  return query(`
    DELETE FROM user_team
    WHERE email = ? AND team_id = ?;
  `, [email, team_id])
}

const setAdminStatus = (team_id, email, team_admin) => {
  return query(`
    UPDATE user_team
    SET team_admin = ?
    WHERE team_id = ? AND email = ?;
  `, [team_admin, team_id, email])
}

module.exports = { planByIosId, teamByInviteCode, deleteInvite, teamInvites, addInvites, teamUserAmount, teamsBySportIdThatDontHaveGroupNamed, teamsBySportIdThatHaveGroupNamed, allTeams, numOfUsersInTeam, deleteUserTeam, createTeam, changeTeamPlan, planByStripeId, userTeamByStripeId, setAdminStatus, deleteUserFromTeam, teamById, changeJoinCode, teamUsers, addUserToTeam, teamByJoinCode, userTeams, userTeamStripeId, userTeamByEmailAndTeamId }