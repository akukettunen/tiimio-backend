const jwt = require("jsonwebtoken")

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

module.exports = { user }