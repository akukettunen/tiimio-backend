const team_db = require('../db/team')

const generateJoinCode = async (num = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPRSTUVX1234567890'
  let code = ''
  for(let i = 0; i < num; i++) {
    console.log(i)
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  const [ team ] = await team_db.teamByJoinCode(code)

  if(team) return generateJoinCode()
  return code
}

module.exports = { generateJoinCode }