const jwt = require('jsonwebtoken');

function getToken(id, role) {
  let token = jwt.sign({ id: id, role: role }, 'getToken', {
    expiresIn: '15m',
  });
  return token;
}
function refreshToken(user) {
  let token = jwt.sign({ id: user.id, role: user.role }, 'refresh', {
    expiresIn: '7d',
  });
  return token;
}

async function sendSms(tel, otp) {
  try {
    api.post('message/sms/send', {
      mobile_phone: tel,
      message: 'Bu Eskiz dan test',
      from: '4546',
    });
    console.log('sended sms', tel, otp);
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getToken, refreshToken, sendSms };
