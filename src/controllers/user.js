import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import logger from '../logger.js';

const jwtSecret = process.env.JWT_SECRET;

async function registerUser(req, res, next) {
  try {
    const { username, password } = req.body;
    const hasOneUser = await User.findOne();
    if (hasOneUser) {
      logger.warn('Tried to register a new user, but registration is closed.', { username });
      res.status(403).json({ error: { message: 'Registration is closed.' } });
      return;
    }


    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      logger.warn('Tried to register a new user, but username is already in use.', { username });
      res.status(409).json({ error: { message: 'Username is already in use.' } });
      return;
    }

    const hashedPassword = await hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });

    const token = jwt.sign({ id: newUser.id }, jwtSecret, { expiresIn: '1d' });
    logger.info('New user registered successfully.', { username, id: newUser.id });
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
      logger.warn('Tried to login, but user does not exist.', { username });
      res.status(401).json({ error: { message: 'Incorrect username or password.' } });
      return;
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Tried to login, but password is incorrect.', { username });
      res.status(401).json({ error: { message: 'Incorrect username or password.' } });
      return;
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1d' });

    logger.info('User logged in successfully.', { username, id: user.id });
    res.status(200).json({ message: 'User logged in successfully', token });
  } catch (error) {
    next(error);
  }
}

export {
  registerUser,
  loginUser,
};
