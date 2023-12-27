const { query, promisePoolEnd } = require('../utils/db/index.js')

module.exports = async () => {
  const db_query = `
    DELETE FROM user WHERE email = 'user@testing.com' OR email = 'user2@testing.com';
  `

  try {
    await query(db_query)
    await promisePoolEnd()
  } catch(e) {
    return console.log('Teardown error: ', e)
  }

  return console.log('Teardown succesfull')
}