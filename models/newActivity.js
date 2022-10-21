const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const ActivitySchema = mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    lockTime: {
        type: Timestamp,
        required: true
    },
    unlockTime: {
        type: Timestamp,
        required: true
    },
    loggedActivity: {
        type: String,
        require: true
    }
});

module.exports = mongoose.model('ActivityLog', ActivitySchema);