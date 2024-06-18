const pool = require("../configs/db");
const { response } = require("../helper/common")
const { selectAccount, selectUser, selectRole, findUser } = require("../models/auth")
const createError = require('http-errors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateToken, generateRefreshToken } = require("../helper/auth");
const { sendResetEmail } = require('../helper/nodemailer');


const verifyAccount = async (req, res, next) => {
    try {
        const { token } = req.query

        const { rows } = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);

        if (rows.length === 0) {
            return next(createError(400, "Token not found"));
        }

        await pool.query('UPDATE users SET verified = true WHERE verification_token = $1', [token]);

        response(res, null, 200, 'Email verified successfully')
    } catch (error) {
        next(new createError[500])
    }

}

// login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return next(createError(400, "Email or password can't be blank"));
        }

        // const { rows: [user] } = await findEmail(email)
        // const { rows } = await selectAccount(email, password);

        const { rows: [user] } = await selectAccount(email)

        if (!user) {
            return next(createError(400, 'Please create a new account or verify your account before logging in'))
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return next(createError(400, 'Email or password is incorrect'))
        }

        delete user.password

        const payload = {
            email: user.email,
            role: user.role,
            userId: user.id
        }

        const token = generateToken(payload)
        const refreshToken = generateRefreshToken(payload)

        response(res, { ...user, token, refreshToken }, 200, 'Login Successful')
        // res.json({
        //     status: 'Success',
        //     message: 'Login successful!',
        // });

        // Ide saat ini adalah untuk menarik user_id untuk disimpan ke localStorage bila berhasil.
    } catch (error) {
        next(new createError[500])
    }

}

// logout
const logout = async (req, res, next) => {
    try {
        // Harunsya sih gak ngapa-ngapain
        // id = req.query.user

        const email = req.decoded.email
        const { rows: [user] } = await findUser(email)

        const { rows } = await selectUser(user.id);

        response(res, rows, 200, 'Logout Successful')
        // Melanjutkan ide login, berarti logout harus menghapus localStorage
    } catch (error) {
        next(new createError[500])
    }

}

// check role
const checkRole = async (req, res, next) => {
    try {
        // Melanjutkan ide login, ambil data user_id, lalu cek rolenya

        // id = req.query.user

        const email = req.decoded.email
        const { rows: [user] } = await findUser(email)

        const { rows } = await selectRole(user.id)

        response(res, rows, 200, 'Get role success')
    } catch (error) {
        next(new createError[500])
    }

}

const refreshToken = async (req, res, next) => {
    const refreshToken = req.body.refreshToken
    const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY_JWT)

    const payload = {
        email: decoded.email,
        role: decoded.role,
        userId: decoded.id
    }

    const data = {
        token: generateToken(payload),
        refreshToken: generateRefreshToken(payload)
    }

    response(res, data, 200, 'Refresh token success')
}

// Request password reset
const requestForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        console.log(email);

        const { rows: [user] } = await findUser(email);
        console.log(user);

        if (!user) {
            return next(createError(400, "Email not found"));
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(resetCode);
        const resetCodeExpiry = new Date(Date.now() + 3600000).toISOString();
        console.log(resetCodeExpiry);

        const result = await pool.query('UPDATE users SET reset_code = $1, reset_code_expiry = $2 WHERE email = $3', [resetCode, resetCodeExpiry, email]);
        console.log(result);

        const resultEmail = await sendResetEmail(email, resetCode);
        console.log(resultEmail);

        response(res, null, 200, 'A reset code has been sent to your email.');
    } catch (error) {
        console.error('Error in requestForgotPassword:', error);
        next(new createError[500]);
    }
};

// Verify reset code
const verifyForgotPassword = async (req, res, next) => {
    try {
        const { email, resetCode } = req.body;
        const { rows: [user] } = await findUser(email);

        if (!user || user.reset_code !== resetCode || Date.now() > user.reset_code_expiry) {
            return next(createError(400, 'Invalid or expired reset code.'));
        }

        response(res, null, 200, 'Reset code is valid. Please proceed to reset your password.');
    } catch (error) {
        next(new createError[500]);
    }
};

// Reset password
const forgotPassword = async (req, res, next) => {
    try {
        const { email, resetCode, newPassword } = req.body;
        const { rows: [user] } = await findUser(email);

        if (!user || user.reset_code !== resetCode || Date.now() > user.reset_code_expiry) {
            return next(createError(400, 'Invalid or expired reset code.'));
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1, reset_code = NULL, reset_code_expiry = NULL WHERE email = $2', [passwordHash, email]);

        response(res, null, 200, 'Password has been reset successfully. Please log in with your new password.');
    } catch (error) {
        next(new createError[500]);
    }
};

module.exports = {
    verifyAccount,
    login,
    logout,
    checkRole,
    refreshToken,
    requestForgotPassword,
    verifyForgotPassword,
    forgotPassword
};