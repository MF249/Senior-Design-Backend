const express = require('express');
const router = express.Router();
const cors = require('cors');
const mqtt = require('mqtt');

router.use(cors());
require('dotenv').config();

router.get('/getCon', async (req, res) => {
    var client = mqtt.connect('mqtt://broker.mqtt-dashboard.com');
    
    client.on('connect', function() {
        console.log('connected');
        
        client.subscribe('outTopic', function(err) {
            if(!err) {
                console.log('subscribed');
                client.publish('inTopic', 'Hello from NodeJS');
            }
        });
    });

    res.send('Error');
});

router.get('/testCon', async (req, res) => {
    const client  = mqtt.connect('mqtt://test.mosquitto.org');
    console.log('connected');

    client.on('connect', function () {
        client.subscribe('presence', function (err) {
            if (!err) {
                console.log('subscribed'); 
                client.publish('presence', 'Hello mqtt');
                console.log('published');
            }
        });
    });

    client.on('message', function (topic, message) {
        console.log(message.toString());
        client.end();
    });
});

module.exports = router;