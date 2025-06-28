const mailjet = require ('node-mailjet')
.apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE)

const sendMailjet = async ({mail, name, subject, message})  => {
  try{
    mailjet
    .post("send", {'version': 'v3.1'})
    .request({
      "Messages":[
          {
              "From": {
                  "Email": "varija.3005@gmail.com",
                  "Name": "RICEHOUSE"
              },
              "To": [
                  {
                      "Email": mail,
                      "Name": name
                  }
              ],
              "Subject": subject,
              "TextPart": message
          }
      ]
    })
  } catch(err) {
    console.log(err)
  }
}

module.exports = sendMailjet;