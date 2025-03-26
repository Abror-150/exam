const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const transporters = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'odilbek3093@gmail.com',
    pass: 'ouli ileb tlqw xvcw',
  },
});

async function sendEmail(email, otp) {
  await transporters.sendMail({
    to: email,
    subject: 'verify auth',
    from: 'urazalievv.abror@gmail.com',
    text: `your one time password ${otp} `,
  });
  console.log('sended email', otp);
}

function getToken(id, role) {
  let token = jwt.sign({ id: id, role: role }, 'getToken', {
    expiresIn: '30m',
  });
  return token;
}
function refreshToken(user) {
  let token = jwt.sign({ id: user.id, role: user.role }, 'refresh', {
    expiresIn: '7d',
  });
  return token;
}

module.exports = { getToken, refreshToken, sendEmail };
