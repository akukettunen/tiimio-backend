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

const is_in_team = (team_id) => {
  var team_id = team_id
  return (req, _res, next) => {
    const team_id = req.body.team_id || req.params.team_id || team_id
    if(!team_id) throw new Error('no team_id present')
  
    const teams = req.tiimio_user?.teams
    if(!teams) throw new Error('no user teams found')

    const is_in = teams.map(team => team.id).includes(parseInt(team_id))
    if(!is_in) throw new Error('wrong team')
  
    next()
  }
}

module.exports = { inline_tiimi_admin, tiimi_admin, user, is_in_team }