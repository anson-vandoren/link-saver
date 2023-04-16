const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const jwtSecret = process.env.JWT_SECRET;

async function registerUser(req, res, next) {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: { message: 'Username is already in use.' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });

    const token = jwt.sign({ id: newUser.id }, jwtSecret, { expiresIn: '1d' });
    res.status(201).json({ message: 'User registered successfully', user: { id: newUser.id, username: newUser.username }, token });
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: { message: 'Incorrect username or password.' } });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: { message: 'Incorrect username or password.' } });
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1d' });

    res.status(200).json({ message: 'User logged in successfully', token });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerUser,
  loginUser,
};
