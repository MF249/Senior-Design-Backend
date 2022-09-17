const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    Username: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    Phone: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    LogID: {}
});

module.exports = mongoose.model('User', UserSchema);