const { query } = require('./index.js')

const addUser = ({ email, full_name, password_hash, language, email_confirmed, email_confirmation_string }) => {
  return query(`
    INSERT INTO user (email, full_name, password, joined, language, email_confirmed, email_confirmation_string)
    VALUES( ?, ?, ?, CURDATE(), ?, ?, ? );
  `, [email, full_name, password_hash, language, email_confirmed || false, email_confirmation_string])
}

const getUserByEmail = email => {
  return query(`
    SELECT email, full_name, tiimio_admin, joined, password, language, email_confirmation_string
    FROM user WHERE email = ?;
  `, [email])
}

const confirmEmail = email => {
  return query(`
    UPDATE user
    SET email_confirmed = true, email_confirmation_string = ''
    WHERE email = ?;
  `, [ email ])
}

const userByConfirmationCode = code => {
  return query(`
    SELECT * FROM user WHERE email_confirmation_string = ?;
  `, [code])
}

const userByConfirmationToken = code => {
  return query(`
    SELECT * FROM user
    WHERE email_confirmation_string = ?;
  `, [code])
}

const addPasswordResetToken = (email, hashed_token, expiry) => {
  return query(`
    INSERT INTO password_reset_tokens (user_id, token, expiry) 
    VALUES(?, ?, ?);
  `, [email, hashed_token, expiry])
}

const deleteAllResetTokensByEmail = email => {
  return query(`
    DELETE FROM password_reset_tokens
    WHERE user_id = ?;
  `, [ email ])
}

const resetTokenByHash = hash => {
  return query(`
    SELECT * FROM password_reset_tokens
    WHERE token = ?;
  `, [ hash ])
}

const setNewPassword = (email, hash) => {
  return query(`
    UPDATE user
    SET password = ?
    WHERE email = ?;
  `, [ hash, email ])
}

const getUserTeam = (email, team_id) => {
  return query(`
    SELECT * FROM user_team
    WHERE email = ? AND team_id = ?;
  `, [email, team_id])
}

const deleteUserTeam = (email, team_id) => {
  return query(`
    DELETE FROM user_team
    WHERE email = ? AND team_id = ?;
    `, [email, team_id])
}

const updateUserTeam = (team_id, email, updates) => {
  let fields = [];
  let values = [];

  for (const field in updates) {
    fields.push(`${ field } = ?`);
    values.push(updates[ field ]);
  }
  
  values.push(team_id);
  values.push(email);

  const q = `
    UPDATE user_team
    SET ${fields.join(', ')}
    WHERE team_id = ? AND email = ?;
  `

  return query(q, values)
}
 
module.exports = { updateUserTeam, deleteUserTeam, getUserTeam, userByConfirmationCode, userByConfirmationToken, confirmEmail, setNewPassword, resetTokenByHash, deleteAllResetTokensByEmail, addUser, getUserByEmail, addPasswordResetToken }