var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var ImgSchema = new Schema({
    img: { 
        data: Buffer, 
        contentType: String,
    },
    date: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('LiveFeed', ImgSchema);