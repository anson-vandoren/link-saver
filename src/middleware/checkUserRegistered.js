import User from '../models/user.js';

async function checkUserRegistered(_req, res, next) {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.redirect('/signup.html');
    }
  } catch (error) {
    return next(error);
  }
  return next();
}

export default checkUserRegistered;
