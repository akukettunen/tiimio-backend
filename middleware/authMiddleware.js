const user = (req, res, next) => {
  const user = req.tiimio_user
  if(user) next()
  else {
    throw new Error('authentication error')
  }
}

module.exports = { user }