import User from '../models/user.ts';

async function checkUserRegistered(req, res, next) {
  const isHtml = req.path.endsWith('.html') || req.path === '/';
  const isSignup = req.path === '/signup.html';
  if (!isHtml || isSignup) {
    return next();
  }
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
