// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const SECRET_KEY = 'db4b9b4a9bfb56e1ee67e22bf0514a02e8062fca4e81182c6201822bd62e4e1f4324bcee62f8bd45b403dcd000bb0258475cf86fc92c2932594b246b2dbbd659';

const handleAuthError = (res, message, logMessage) => {
  console.log(logMessage);
  return res.status(401).send(message);
};

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('auth middleware: Decoded token:', decoded);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Attach the user object to req.user, including nationalId
    req.user = {
      id: user.id,
      email: user.email,
      phoneNumber: decoded.phoneNumber,
      role: user.role,
      nationalId: decoded.nationalId,  // Use the nationalId from the token
    };

    console.log('auth middleware: User information attached to req.user:', req.user);
    next();
  } catch (err) {
    res.status(401).send('Invalid token.');
  }
};

module.exports = auth;