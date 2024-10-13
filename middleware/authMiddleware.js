const jwt = require("jsonwebtoken")
require('express-async-errors');

const user = (req, res, next) => {
  const token = req.token
  
  if(!token) {
    throw new Error('authentication error')
  }

  let verified = jwt.verify(token, process.env.SECRET_KEY)

  if(!verified) {
    throw new Error('authentication error')
  }

  next()
}

const tiimi_admin = (req, res, next) => {
  const token = req.token
  
  if(!token) {
    throw new Error('authentication error')
  }

  let verified = jwt.verify(token, process.env.SECRET_KEY)
  let is_admin = req.tiimio_user.tiimio_admin

  if(!verified || !is_admin) {
    throw new Error('authentication error')
  }

  next()
}

const inline_tiimi_admin = (req, res, next) => {
  const admin = req.tiimio_user?.tiimio_admin

  if(!admin) throw new Error('authentication error')
}

// this is used for now only when deleting tags, views or groups at the league level
const inline_aku_kettunen = (req, res, next) => {
  const is_aku = req.tiimio_user.email === 'aku@kettunen.com'

  if(!is_aku) throw new Error('not admin admin')
}

const inline_is_in_team = (team_id, req) => {
  if(!team_id) throw new Error('no team_id present')

  const teams = req.tiimio_user?.teams
  if(!teams) throw new Error('no user teams found')

  const is_in = teams.map(team => team.id).includes(parseInt(team_id))
  if(!is_in) throw new Error('wrong team')
}

const inline_is_in_league = (league_id, req) => {
  if(!league_id) throw new Error('no league_id present')

  const teams = req.tiimio_user?.teams
  if(!teams) throw new Error('user not in any teams')
  const team = teams.find(t => t.id === req.tiimio_user.currentTeamId)

  if(team.league_id !== league_id) throw new Error('team not in league')
}

const inline_is_in_league_or_admin = (league_id, req) => {
  if(req.tiimio_user.tiimio_admin) return true

  if(!league_id) throw new Error('no league_id present')

  const teams = req.tiimio_user?.teams
  if(!teams) throw new Error('user not in any teams')
  const team = teams.find(t => t.id === req.tiimio_user.currentTeamId)

  if(team.league_id !== league_id) throw new Error('team not in league')
}

const is_in_team = (team_id) => {
  var t_id = team_id
  return (req, _, next) => {
    let team_id = req.body.team_id || req.params.team_id || t_id
    if(!team_id) throw new Error('no team_id present')
  
    const teams = req.tiimio_user?.teams
    if(!teams) throw new Error('no user teams found')

    const is_in = teams.map(team => team.id).includes(parseInt(team_id))
    if(!is_in) throw new Error('wrong team')

    if(next) next()
  }
}

module.exports = { inline_aku_kettunen, inline_is_in_league_or_admin, inline_is_in_league, inline_is_in_team, inline_tiimi_admin, tiimi_admin, user, is_in_team }