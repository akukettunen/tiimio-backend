const { query } = require('./index.js')

const addUser = ({ email, full_name, password_hash, language }) => {
  return query(`
    INSERT INTO user (email, full_name, password, joined, language)
    VALUES( ?, ?, ?, CURDATE(), ? );
  `, [email, full_name, password_hash, language])
}

const getUserByEmail = email => {
  return query(`
    SELECT email, full_name, tiimio_admin, joined, password, language
    FROM user WHERE email = ?;
  `, [email])
}

const addPasswordResetToken = (email, hashed_token, expiry) => {
  return query(`
    INSERT INTO password_reset_tokens (user_id, token, expiry) 
    VALUES(?, ?, ?);
  }
  `, [email, hashed_token, expiry])
}

module.exports = { addUser, getUserByEmail, addPasswordResetToken }