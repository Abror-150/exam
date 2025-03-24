const Users = require('../models/user');
const { Router } = require('express');
const route = Router();
const bcrypt = require('bcrypt');
const { totp } = require('otplib');
const jwt = require('jsonwebtoken');
const { sendSms } = require('../functions/eskiz');
const { Op } = require('sequelize');
const { getToken } = require('../functions/eskiz');
const { refreshToken } = require('../functions/eskiz');

route.post('/send-otp', async (req, res) => {
  let { phone } = req.body;
  try {
    let user = await Users.findOne({ where: { phone } });
    if (user) {
      return res.status(401).send({ message: 'user already exists' });
    }
    let otp = totp.generate(phone + 'lorem');
    await sendSms(phone, otp);
    res.send(otp);
  } catch (error) {
    console.log(error);
  }
});

route.post('/verify-otp', async (req, res) => {
  let { otp, phone } = req.body;
  try {
    let match = totp.verify({ token: otp, secret: phone + 'lorem' });
    if (!match) {
      return res.status(402).send({ message: 'otp or phone notogri' });
    }
    res.send(match);
  } catch (error) {
    console.log(error);
  }
});

route.post('/register', async (req, res) => {
  let { firstName, email, password, ...rest } = req.body;
  try {
    let user = await Users.findOne({
      where: { firstName },
    });
    if (user) {
      return res.status(401).send({ message: 'Username already exists' });
    }
    let user2 = await Users.findOne({
      where: { firstName },
    });
    if (user2) {
      return res.status(401).send({ message: 'Email already exists' });
    }
    let hash = bcrypt.hashSync(password, 10);
    let newUser = await Users.create({
      ...rest,
      firstName,
      email,
      password: hash,
      status: 'PENDING',
    });

    res.send(newUser);
  } catch (error) {
    console.log(error);
  }
});

route.post('/login', async (req, res) => {
  let { firstName, password } = req.body;
  try {
    let user = await Users.findOne({ where: { firstName } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Wrong password error' });
    }

    let userIp = req.ip;

    await Users.update({ lastIp: userIp }, { where: { id: user.id } });

    let accesToken = getToken(user.id, user.role);
    let refreToken = refreshToken(user);

    res.json({ accesToken, refreToken });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

route.post('/refresh', async (req, res) => {
  let { refreshTok } = req.body;
  try {
    const user = jwt.verify(refreshTok, 'refresh');
    const newAccestoken = getToken(user.id);
    res.send({ newAccestoken });
  } catch (error) {
    console.log(error);
  }
});

route.get('/', async (req, res) => {
  let data = await Users.findAll();
  res.send(data);
});

module.exports = route;
