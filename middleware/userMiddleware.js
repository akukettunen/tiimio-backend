const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  let auth = req.headers['authorization']

  if(auth) {
    let token = auth.substring(7)
    req.tiimio_user = jwt.decode(token)
    req.token = token
  }
  
  next();
};