const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const emailVerificationTokenSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // to give the ref of the ObjectId belongs to whom.
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        expires: 3600,
        default: Date.now()
    },
});

// before save the file we need to run this function to encrypt the token.
emailVerificationTokenSchema.pre('save', async function (next) {
    if (this.isModified('token')) {
        this.token = await bcrypt.hash(this.token, 10) // hashing pass -> async task   
    }
    next();
});

// Can be added more custome methods to the schema.
emailVerificationTokenSchema.methods.compaireToken = async function(token) {
    const result = await bcrypt.compare(token, this.token);
    return result;
}

module.exports = mongoose.model("EmailVerificationToken", emailVerificationTokenSchema)
