const { isValidObjectId } = require('mongoose')
const PasswordResetToken = require('../models/passwordResetToken')
const { sendError } = require('../utils/helper')

exports.isValidPassResetToken = async (req, res, next) => {
    const { token, userId } = req.body

    if (!token.trim() || !isValidObjectId(userId)) return sendError(res, 'Invalid request!')

    const resetToken = await PasswordResetToken.findOne({ owner: userId })
    if (!resetToken) return sendError(res, 'Unauthorised or Invalid Requrest1!');

    const isMatched = await resetToken.compaireToken(token);
    if(!isMatched) return sendError(res, 'Unauthorised or Invalid Requrest2!');

    req.resetToken = resetToken
    next();
}