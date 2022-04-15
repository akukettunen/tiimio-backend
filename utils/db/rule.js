const { query } = require('./index.js')

const saveRule = (rule, email) => {
  return query(`
    INSERT INTO clipper_rule (if_rule, then_rule, when_rule, user_id) 
    VALUES (?, ?, ?, ?);
  `, [rule.if_rule, rule.then_rule, rule.when_rule, email])
}
module.exports = {saveRule}

const userRules = (email) => {
  return query(`
    SELECT * FROM clipper _rule
    WHERE user_id = ?;
  `, [ email ])
}

module.exports = { userRules, saveRule }