const express = require('express');
const { create, verifyEmail, resendEmailVerificationToken, forgetPassword, sendResetPasswordStatus, resetPassword, signIn } = require('../controllers/user');
const { isValidPassResetToken } = require('../middlewares/user');
const { validate, validatePassword, userValidator, signInValidator } = require('../middlewares/validators');

const router = express.Router();

router.post('/create', userValidator, validate, create);
router.post('/sign-in', signInValidator, validate, signIn);
router.post('/verify-email', verifyEmail);
router.post('/resend-email-verification', resendEmailVerificationToken);
router.post('/forget-password', forgetPassword);
// middleware are to check reset password token is valid or not.
router.post('/verify-password-reset-token', isValidPassResetToken , sendResetPasswordStatus);
router.post('/reset-password',validatePassword, validate, isValidPassResetToken , resetPassword);

module.exports = router;