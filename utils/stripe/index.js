require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);

const createCustomer = async c => {
  const customer = await stripe.customers.create({
    email: c.email,
    name: c.full_name,
    metadata: c.meta
  })

  return customer
}

const changePlan = ({ plan_id, team_id }) => {
  
}

module.exports = { createCustomer }