const { query } = require('./index.js')

const getSports = () => {
  return query(`
    SELECT * FROM sport
    LIMIT 100;
  `)
}

const allSports = () => {
  return query(`
    SELECT * FROM sport;
  `)
}


module.exports = { getSports, allSports }