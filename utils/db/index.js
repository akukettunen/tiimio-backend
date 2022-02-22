let mysql = require('mysql');
promisify = require('util');
require('dotenv').config()

const databaseConfig = {
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const pool = mysql.createPool(databaseConfig)
const query = promisify.promisify(pool.query).bind(pool)
const promisePoolEnd = promisify.promisify(pool.end).bind(pool)

const deleteObjectById = (table, id) => {
  return query(`
    DELETE FROM ?
    WHERE id = ?;
  `, table, id)
}

// query('SET time_zone = "+00:00";')
//   .then(e => {
//     console.log('DB timezone set to zero ')
//   })
//   .catch(e => {
//     throw new Error(e)
//   })

module.exports = {
  query,
  promisePoolEnd,
  databaseConfig,
  deleteObjectById
};