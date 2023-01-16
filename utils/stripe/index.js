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

const sessionById = async id => {
  const session = await stripe.checkout.sessions.retrieve(id);

  return session
}

const customerById = async id => {
  const customer = await stripe.customers.retrieve(
    'cus_Ku7r2iRWZe1anB'
  );

  return customer
}

const customerSubscriptionsById = async id => {
  const subscriptions = await stripe.subscriptions.list({
    customer: id
  });
  
  return subscriptions
}

const portalSessionUrlByStripeId = async id => {
  return await stripe.billingPortal.sessions.create({
    customer: id,
    return_url: process.env.FRONTEND_BASE_URL + '/#/refresh',
  });
}

const checkoutSessionUrlByStripeId = async (id, lookup_key) => {
  return await stripe.checkout.sessions.create({
    billing_address_collection: 'auto',
    line_items: [
      {
        price: lookup_key,
        quantity: 1
      },
    ],
    // todo ??
    customer: id,
    mode: 'subscription',
    success_url: process.env.FRONTEND_BASE_URL + '/#/refresh?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: process.env.FRONTEND_BASE_URL + '/#/plans',
    'customer_update[address]': 'auto',
    allow_promotion_codes: 'true',
    trial_period_days: '15',
    automatic_tax: { enabled: true }
  });
}

module.exports = { checkoutSessionUrlByStripeId, portalSessionUrlByStripeId, createCustomer, sessionById, customerById, customerSubscriptionsById }