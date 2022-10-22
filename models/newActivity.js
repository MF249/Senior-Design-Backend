const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const ActivitySchema = mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    lockTime: {
        type: Array,
        required: true
    },
    unlockTime: {
        type: Array,
        required: true
    },
    activityStatus: {
        type: String,
        require: true
    }
});

module.exports = mongoose.model('ActivityLog', ActivitySchema);