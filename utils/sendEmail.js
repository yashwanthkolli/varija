const nodemailer = require('nodemailer');
const Mailgun = require('mailgun.js');
const FormData = require('form-data');

const sendEmail = async () => {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API,
    // When you have an EU-domain, you must specify the endpoint:
    // url: "https://api.eu.mailgun.net"
  });

  try {
    const data = await mg.messages.create("sandbox6a3d278399c140e885be35b9876041f1.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox6a3d278399c140e885be35b9876041f1.mailgun.org>",
      to: ["Yashwanth Kolli <yashwanthkolli3271@gmail.com>"],
      subject: "Hello Yashwanth Kolli",
      text: "Congratulations Yashwanth Kolli, you just sent an email with Mailgun! You are truly awesome!",
    });

     console.log(data); // logs response data
  } catch (error) {
    console.log(error); //logs any error
  }
};

module.exports = sendEmail;