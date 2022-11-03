const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const ActivitySchema = mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    lockTime: [{
        type: String,
    }],
    unlockTime: [{
        type: String,
    }],
    // -1: disabled, 0: default/unknown. 1: enabled
    activityStatus: {
        type: Number, 
        enum: [-1, 0, 1],
        default: 0,
        required: true
    }
});

module.exports = mongoose.model('Activity', ActivitySchema);