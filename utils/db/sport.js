const { query } = require('./index.js')

const getSports = () => {
  return query(`
    SELECT * FROM sport
    LIMIT 100;
  `)
}


module.exports = { getSports }