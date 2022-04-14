const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.SES_REGION,
  accessKeyId: process.env.SES_ACCESS_KEY,
  secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
});

const ses = new AWS.SES({apiVersion: '2010-12-01'});

const sendWelcomeEmail = email => {
  const params = {
    Destination: {
     BccAddresses: [],
     CcAddresses: [],
     ToAddresses: [ email ]
    },
    Message: {
     Body: {
      Html: {
       Charset: "UTF-8",
       Data: `
        <div class="emailBody">
            <h1>Welcome to Tiimi!</h1>
            <h3>Please confirm your email!</h3>
            <p>You can confirm your email <a>täällä</a>.</p>
            <p>If you have any questions regarding Tiimi you can just reply to this email. We're happy to help :)</p>
            <p>Best regards,</p>
            <p>Aku, Tiimi</p>
        </div>
        <style>
            body {
                background-color: lightgrey;
            }
            .emailBody {
                width: 800px;
                background-color: white;
                margin: 0 auto;
                text-align: center;
                padding: 40px 0;
            }
            .emailBody h1 {
                color: #43589c;
            }
            .codeBody {
                font-size: 50px;
            }
        </style>
       `
      }, 
      Text: {
       Charset: "UTF-8", 
       Data: `
          Welcome to Tiimi!
          You can confirm your email here:
          {{link}}
          If you have any questions regarding Tiimi you can just reply to this email. We're happy to help :)

          Best regards,
          Aku, Tiimi
       `
      }
     }, 
     Subject: {
      Charset: "UTF-8", 
      Data: "Vahvistuskoodi ePesikseen"
     }
    }, 
    Source: "Aku from Tiimi <help@tiimi.io>",
   };

   return ses.sendEmail(params).promise()
}

module.exports = { sendWelcomeEmail }