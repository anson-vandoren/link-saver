const User = require('../models/user');

async function checkUserRegistered(req, res, next) {
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

module.exports = {
  checkUserRegistered,
};
