let md5 = require('md5')
    mailchimp =  require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: "us10",
});

const addUserToAudience = async (userId, first_name, last_name, tags) => {
  return new Promise((resolve, reject) => {
    const subscriberHash = md5(userId.toLowerCase());

    mailchimp.lists.setListMember(
      process.env.MAILCHIMP_LIST,
      subscriberHash,
      {
        tags,
        email_address: userId, 
        status_if_new: "subscribed",
        merge_fields: { FNAME: first_name, LNAME: last_name }
      }
    )
    .then(e => {
      resolve(e)
    })
    .catch(e => {
      reject(e)
    })
  })
}

const addTagToUser = async (userId, tags, active = true) => {
  return new Promise((resolve, reject) => {
    const subscriberHash = md5(userId.toLowerCase());
    let add_tags = tags.map(tag => { return { "name": tag, "status": active ? "active" : "inactive" } })
  
    mailchimp.lists.updateListMemberTags(
      process.env.MAILCHIMP_LIST,
      subscriberHash,
      {
        "tags": add_tags,
      }
    )
    .then(e => {
      resolve(e)
    })
    .catch(e => {
      reject(e)
    })
  })

}

module.exports = { addTagToUser, addUserToAudience }

