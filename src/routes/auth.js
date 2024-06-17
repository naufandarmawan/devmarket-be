const express = require('express')
const { login, logout, checkRole, refreshToken, verifyAccount, requestForgotPassword, verifyForgotPassword, forgotPassword} = require('../controller/auth')
const pool = require('../configs/db')
const { protect } = require('../middlewares/auth')
const route = express.Router()

// /product
route
  .post('/login', login)
  .get('/logout', protect, logout )
  .get('/checkrole', protect, checkRole )
  .post('/refreshtoken', refreshToken)
  .get('/verify', verifyAccount)
  .post('/request-forgot-password', requestForgotPassword)
  .post('/verify-forgot-password', verifyForgotPassword)
  .post('/forgot-password', forgotPassword);

module.exports = route