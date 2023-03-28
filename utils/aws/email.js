const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.SES_REGION,
  accessKeyId: process.env.SES_ACCESS_KEY,
  secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
});

const ses = new AWS.SES({apiVersion: '2010-12-01'});

const invite_to_team_email = (email, code) => {
  const params = {
    Destination: {
     BccAddresses: [],
     CcAddresses: [],
     ToAddresses: [ email ]
    },
    Message: {
     Body: {
      Text: {
       Charset: "UTF-8", 
       Data: `
          Hi!
          
          You have been invited to join a team in tiimi.io!

          Join the team here: ${process.env.FRONTEND_BASE_URL}/#/signin?invite_code=${code}

          Best regards,
          Tiimi
       `
      }
     }, 
     Subject: {
      Charset: "UTF-8", 
      Data: "You have been invited to a team!"
     }
    },
    Source: "Aku from Tiimi <help@tiimi.io>",
   };

   return ses.sendEmail(params).promise()
} 

const sendWelcomeEmail = (email, link) => {
  const params = {
    Destination: {
     BccAddresses: [],
     CcAddresses: [],
     ToAddresses: [ email ]
    },
    Message: {
     Body: {
    //   Html: {
    //    Charset: "UTF-8",
    //    Data: `
    //     <div class="emailBody">
    //         <h1>Welcome to Tiimi!</h1>
    //         <h3>Please confirm your email!</h3>
    //         <p>You can confirm your email <a>täällä</a>.</p>
    //         <p>If you have any questions regarding Tiimi you can just reply to this email. We're happy to help :)</p>
    //         <p>Best regards,</p>
    //         <p>Aku, Tiimi</p>
    //     </div>
    //     <style>
    //         body {
    //             background-color: lightgrey;
    //         }
    //         .emailBody {
    //             width: 800px;
    //             background-color: white;
    //             margin: 0 auto;
    //             text-align: center;
    //             padding: 40px 0;
    //         }
    //         .emailBody h1 {
    //             color: #43589c;
    //         }
    //         .codeBody {
    //             font-size: 50px;
    //         }
    //     </style>
    //    `
    //   }, 
      Text: {
       Charset: "UTF-8", 
       Data: `
          Welcome to Tiimi!

          You can confirm your email here:
          ${link}

          If you have any questions regarding Tiimi you can just reply to this email. We're happy to help :)

          Best regards,
          Aku, Tiimi
       `
      }
     }, 
     Subject: {
      Charset: "UTF-8", 
      Data: "Welcome to Tiimi!"
     }
    }, 
    Source: "Aku from Tiimi <help@tiimi.io>",
   };

   return ses.sendEmail(params).promise()
}

const sendRefreshEmail = (email, link, minutes, expiry) => {
    const date = new Date(expiry)
    const params = {
      Destination: {
       BccAddresses: [],
       CcAddresses: [],
       ToAddresses: [ email ]
      },
      Message: {
       Body: {
        Text: {
         Charset: "UTF-8", 
         Data: `
            Hi!

            You recently requested to change your Tiimi password.

            Follow this link to do so: 
            ${link}

            Link will be active for the next ${minutes} minutes ( until ${date} )

            Do not give this link to anyone else. If you did not request to change your password or have questions,
            please contact help@tiimi.io .

            - Tiimi team
        `
        }
       }, 
       Subject: {
        Charset: "UTF-8", 
        Data: "Password reset"
       }
      }, 
      Source: "Tiimi <help@tiimi.io>",
     };
  
     return ses.sendEmail(params).promise()
}

const sendAkuAnEmail = () => {
  const params = {
    Destination: {
     BccAddresses: [],
     CcAddresses: [],
     ToAddresses: [ 'aku@kettunen.com' ]
    },
    Message: {
     Body: {
      Text: {
       Charset: "UTF-8", 
       Data: `
          New team created!

          - tiimi.io
      `
      }
     }, 
     Subject: {
      Charset: "UTF-8", 
      Data: "New tiimi.io team created!"
     }
    }, 
    Source: "Tiimi <help@tiimi.io>",
   };

   return ses.sendEmail(params).promise()
}

module.exports = { sendAkuAnEmail, invite_to_team_email, sendWelcomeEmail, sendRefreshEmail }