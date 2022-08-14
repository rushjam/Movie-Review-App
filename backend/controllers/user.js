const jwt = require('jsonwebtoken');

const User = require('../models/user');
const EmailVerificationToken = require('../models/emailVerificationToken');
const passwordResetToken = require('../models/passwordResetToken');
const { isValidObjectId } = require('mongoose');
const { generateOTP, generateMailTransporter } = require('../utils/mail');
const { sendError, generateRandomByte } = require('../utils/helper');

exports.create = async (req, res) => {
    const { name, email, password } = req.body

    const oldUser = await User.findOne({ email });

    // 401 -> unauthorised task. Creating an already registered user is unauthorised task.
    if (oldUser) return sendError(res, "This Email is already Exists!");
    const newUser = new User({ name, email, password })

    // saving the data into the database is async task.
    await newUser.save();

    // Generate 6 digit OTP
    let OTP = generateOTP()

    // Store OTP inside DB
    const newEmailVerificationToken = new EmailVerificationToken({ owner: newUser._id, token: OTP })
    // saving the data into the database is async task.
    await newEmailVerificationToken.save();

    // Send OTP to the user.

    var transport = generateMailTransporter()

    transport.sendMail({
        from: 'verification@reviewapp.com',
        to: newUser.email,
        subject: 'Email Verification',
        html: `
            <p>Your Verification OTP </p>
            <h1>${OTP}</h1>
            `
    })
    res.status(201).json({ message: 'Please verify your email. OTP has been sent to your email account!' })
}

exports.verifyEmail = async (req, res) => {
    const { userId, OTP } = req.body;

    if (!isValidObjectId(userId)) return res.json({ error: "Invalid user!" });

    const user = await User.findById(userId)

    if (!user) return sendError(res, "User not found!", 404);
    if (user.isVerified) return sendError(res, "User is already verified!");

    const token = await EmailVerificationToken.findOne({ owner: userId });

    if (!token) return sendError(res, "Token not found!");

    const isMatched = token.compaireToken(OTP);
    if (!isMatched) return sendError(res, "Please submit a valid OTP!");

    user.isVerified = true;

    await user.save();

    await EmailVerificationToken.findByIdAndDelete(token._id);

    var transport = generateMailTransporter()

    transport.sendMail({
        from: 'verification@reviewapp.com',
        to: user.email,
        subject: 'Welcome Email',
        html: '<h1>Welcome to our app and thanks for choosing us.</h1>'
    });

    res.json({ message: "Your email is verified" });
}

exports.resendEmailVerificationToken = async (req, res) => {
    const { userId } = req.body

    const user = await User.findById(userId)
    if (!user) return sendError(res, "User not found!", 404);
    if (user.isVerified) return sendError(res, "This email is already verified!");

    const alreadyHasToken = await EmailVerificationToken.findOne({ owner: userId });

    if (alreadyHasToken) return sendError(res, "Only after one hour you can request another token!");

    // Generate 6 digit OTP
    let OTP = generateOTP()

    // Store OTP inside DB
    const newEmailVerificationToken = new EmailVerificationToken({ owner: user._id, token: OTP })

    // saving the data into the database is async task.
    await newEmailVerificationToken.save();

    // Send OTP to the user.
    var transport = generateMailTransporter()

    transport.sendMail({
        from: 'verification@reviewapp.com',
        to: user.email,
        subject: 'Email Verification',
        html: `
            <p>Your Verification OTP </p>
            <h1>${OTP}</h1>
            `
    });
    res.status(201).json({ message: 'Please verify your email. OTP has been sent to your email account!' })
};

exports.forgetPassword = async (req, res) => {
    const { email } = req.body
    if (!email) return sendError(res, 'Email is missing!');

    const user = await User.findOne({ email })
    if (!user) return sendError(res, 'User not found!', 404);

    const alreadyHasToken = await passwordResetToken.findOne({ owner: user._id });

    if (alreadyHasToken) return sendError(res, "Only after one hour you can request another token!");

    const token = await generateRandomByte();
    const newPasswordResetToken = await passwordResetToken({ owner: user._id, token });

    await newPasswordResetToken.save();

    const resetPasswordUrl = `http://local:3000/reset-password?token=${token}&id=${user._id}`;

    const transport = generateMailTransporter()

    transport.sendMail({
        from: 'security@reviewapp.com',
        to: user.email,
        subject: 'Reset Password Link',
        html: `
        <p>Click here to reset password</p>
        <a href='${resetPasswordUrl}'>Change Password</a>
        `
    });

    res.json({ message: "Link sent to your email!" });
}

exports.sendResetPasswordStatus = (req, res) => {
    res.json({ valid: true });
}

exports.resetPassword = async (req, res) => {
    const { newPassword, userId } = req.body;

    const user = await User.findById(userId);
    const matched = await user.comparePassword(newPassword)

    if (matched) return sendError(res, 'The new password must be different from the old one!');

    user.password = newPassword

    await user.save();

    await passwordResetToken.findByIdAndDelete(req.resetToken._id);

    const transport = generateMailTransporter()

    transport.sendMail({
        from: 'security@reviewapp.com',
        to: user.email,
        subject: 'Password Reset Successfully',
        html: `
        <h1>Password Reset successfully</h1>
        <p>Now you can use new password.</p>
        `
    });

    res.json({ message: "Password reset successfully. Now you can use new password!" });
}

exports.signIn = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return sendError(res, 'Email/Password mismatch!');

    const matched = await user.comparePassword(password);
    if (!matched) return sendError(res, 'Email/Password mismatch!');

    const { _id, name } = user;

    //defination -> jwt(payload, secretKey, (optional) expiresin)
    const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

    res.json({ user: { id: _id, name, email, token: jwtToken } })

}