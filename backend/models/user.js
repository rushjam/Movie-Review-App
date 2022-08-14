const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// storing, fetching, deleting all the operations that will perform to the database will async task.
const userSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    }
})

// before save the file we need to run this function to encrypt the password.
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10) // hashing pass -> async task   
    }
    next();
});

userSchema.methods.comparePassword = async function(password) {
    const result = await bcrypt.compare(password, this.password);
    return result;
}

module.exports = mongoose.model("User", userSchema)