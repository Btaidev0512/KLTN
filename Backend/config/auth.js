const jwt = require('jsonwebtoken');
require('dotenv').config();

const authConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpire
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, authConfig.refreshSecret, {
    expiresIn: authConfig.refreshExpire
  });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, authConfig.jwtSecret);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, authConfig.refreshSecret);
};

module.exports = {
  authConfig,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
};