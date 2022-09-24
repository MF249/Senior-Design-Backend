const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    emailConfirm: {
        type: Number, 
        enum: [-1, 1],
        default: -1
    },
    verifyPIN: {
        type: Number,
        required: true,
        default: -1
    },
    logID: {}
});

module.exports = mongoose.model('User', UserSchema);