const mqtt = require('mqtt');
require('dotenv').config();

var client = mqtt.connect('mqtt://io.adafruit.com', {
    username: 'LiveBolt',
    password: 'livebolt123'
});

var ssd1306topic = `${client.options.username}/f/ssd1306`;


module.exports = {
    connectToESP: function (callback) {
        client.on('connect', function() {
            console.log('connected');
        
            client.subscribe(ssd1306topic, function(err) {
                if(!err) {
                    console.log('subscribed');
                    client.publish(ssd1306topic, 'Hello from NodeJS');
                }
            });
        });
    },

    getClient: function (callback) {
        return client;
    },
};