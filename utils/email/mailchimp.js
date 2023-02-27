let md5 = require('md5')
    mailchimp =  require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
  apiKey: "817a7cd392d952f797304d119581ee53-us10",
  server: "us10",
});

addUserToAudience = async (userId, first_name, last_name) => {
  return new Promise((resolve, reject) => {
    const subscriberHash = md5(userId.toLowerCase());
    console.log(mailchimp)
    mailchimp.lists.setListMember(
      "483d83dc99",
      subscriberHash,
      {
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

addTagToUser = async (userId, tags) => {
  return new Promise((resolve, reject) => {
    const subscriberHash = md5(userId.toLowerCase());
    let add_tags = tags.map(tag => { return { "name": tag, "status": "active" } })
  
    mailchimp.lists.updateListMemberTags(
      "483d83dc99",
      subscriberHash,
      {
        "body": {
          "tags": add_tags,
        },
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

