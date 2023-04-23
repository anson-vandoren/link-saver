const User = require('../models/user');
// Inside a new middleware file or your main app file
async function checkUserRegistered(req, res, next) {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.redirect('/signup.html');
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkUserRegistered,
}