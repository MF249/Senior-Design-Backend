const express = require('express');
const router = express.Router();
const cors = require('cors');
const mqtt = require('mqtt');

router.use(cors());
require('dotenv').config();

const connectUrl = 'mqtt://192.168.1.180';

router.get('/getCon', async (req, res) => {
    var client = mqtt.connect();
    client.on('connect', function () {
        client.subscribe('first/test');
        client.publish('first/test','Hello');
    });


    client.on('message', function (topic, message) {
        console.log(message.toString());
        client.end();
    });
});

router.get('/testCon', async (req, res) => {
    const client  = mqtt.connect(connectUrl);
    client.on('connect', function (err) {
        console.log('connnected');
        client.subscribe('myfirst/test');
        client.publish('myfirst/test', '1');
    });
});

module.exports = router;