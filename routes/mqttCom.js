const express = require('express');
const router = express.Router();
const cors = require('cors');
const mqtt = require('mqtt');

router.use(cors());
require('dotenv').config();

// Command Line Tools
// mosquitto_sub -d -h localhost -p 1883 -t "myfirst/nodejs"
// mosquitto_pub -d -h localhost -p 1883 -t "myfirst/nodejs" -m "Hello"

const connectUrl = 'mqtt://192.168.1.180';

router.get('/testRouter', async (req, res) => {
    res.send({ 'message' : 'Hello from /mqtt'});
});

router.get('/testCon', async (req, res) => {
    
    const client  = mqtt.connect('mqtt://test.mosquitto.org');
    client.on('connect', function (err) {
        console.log('connnected');
        client.subscribe('livebolt/nodejs');
        client.publish('livebolt/nodejs', '1');
    });

    client.on('message', function (topic, message) {
        response = 'Sent ' + message.toString() + ' from topic ' + topic.toString();
        res.send({ 'message' : response });
        client.end();
    });
});

router.post('/testLock', async (req, res) => {
    
    let lockCommand = req.body.status;
    let response;
    
    const client  = mqtt.connect('mqtt://test.mosquitto.org');
    client.on('connect', function (err) {
        console.log('connnected to test.mosquitto.org...');
        client.subscribe('livebolt/nodejs');
        client.publish('livebolt/nodejs', lockCommand);
    });

    client.on('message', function (topic, message) {
        response = 'Sent ' + message.toString() + ' from topic ' + topic.toString();
        res.send({ 'message' : response });
        client.end();
    });
});

module.exports = router;