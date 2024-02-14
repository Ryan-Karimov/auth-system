const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Joi = require('joi');
const User = require('../models/users.models');


require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    confirm_password: Joi.ref('password'),
    email: Joi.string().email().required()

})
exports.register = async (req, res) => {
  try {
    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
      // return res.status(400).json({ message: validationResult.error.details[0].message });
      return res.status(400).json({ message: "Validation error" });
    }
    
    const existingUser = await User.findOne({
      where: {username: req.body.username}
    })
    if (existingUser) {
      return res.status(400).json({message: 'Username already exists'})
    }
    const existingGmail = await User.findOne({
      where: {email: req.body.email}
    })
    if (existingGmail) {
      return res.status(400).json({message: 'Email already exists'})
    }
    const count_users = await User.count();
    if (count_users == 0) {
      req.body['role'] = 'admin'
    } else {
      req.body['role'] = 'user'
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    // Yangi foydalanuvchi yaratish
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role
    });
    res.status(201).json({ message: 'User registered successfully'});
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Sequelize Unique Constraint Error' });
    }
    // Boshqa turdagi xatoliklarni bartaraf etish
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  // Foydalanuvchini tekshirish
  const { usernameOrEmail, password } = req.body;

  // Username yoki email orqali foydalanuvchini topish
  const user = await User.findOne({
    where: {
      [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
  });

  if (!user) {
    return res.status(400).send('Cannot find user');
  }

  try {
    if (await bcrypt.compare(password, user.password)) {
      // Foydalanuvchi autentifikatsiya qilingan, endi JWT yaratamiz
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        jwtSecret,
        { expiresIn: '10h' }
      );
      res.json({ token: token });
    } else {
      res.send('Wrong email or password.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};