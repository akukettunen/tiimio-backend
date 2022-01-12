const { query } = require('./index.js')

const addUser = ({ email, full_name, password_hash }) => {
  return query(`
    INSERT INTO user (email, full_name, password, joined)
    VALUES( ?, ?, ?, CURDATE() );
  `, [email, full_name, password_hash])
}

const getUserByEmail = email => {
  return query(`
    SELECT email, full_name, tiimio_admin, joined, password
    FROM user WHERE email = ?;
  `, [email])
}

module.exports = { addUser, getUserByEmail }