const express = require('express');
const mongoUtil = require('../mongoUtil');
const User = require('../models/newUser.js');

const router = express.Router();

router.get('/getTest', (req, res) => {
    res.send('Testing...');
});

router.post('/postTest', (req, res) => {
    console.log(req.body);
    res.send(req.body);
});

router.post('/createUser', (req, res) => {
    console.log(req.body);
    res.send(req.body);
});

router.get('/getAll', async (req, res) => {
        
    let db_connect = mongoUtil.getDb("AppTest");
    db_connect.collection("Users").find({}).toArray(function (err, result) {
        if (err) throw err;
        res.json(result);
    });
});

router.post('/login', async (req, res) => {
    
    username = req.body.username;
    password = req.body.password;

    console.log('Searching for ' + username + " :");

    let db_connect = mongoUtil.getDb("AppTest");
    let myquery = { Username: username, Password: password };
    db_connect.collection("Users").findOne(myquery, function (err, result) {
        if (err) throw err;
        if (result) { res.json(result) } else { res.send('Incorrect username/password entered.') }
    });
});

router.post('/register', async (req, res) => {
    
    const newUser = new User ({
        Username: req.body.username,
        Password: req.body.password,
        Name: req.body.name,
        Phone: req.body.phone,
        Email: req.body.email
    });

    let db_connect = mongoUtil.getDb("AppTest");
    let userQuery = { Username: req.body.username };
    let emailQuery = { Email: req.body.email };
    const userExist = await db_connect.collection("Users").find(userQuery).toArray();
    const emailExist = await db_connect.collection("Users").find(emailQuery).toArray();
    
    if (userExist.length != 0) {
        res.send('A user with this username already exists.');
    } else if (emailExist.length != 0) {
        res.send('This email address already has an account active.');
    } else {
        db_connect.collection("Users").insertOne(newUser, function (err, result) {
            if (err) throw err;
            if (result) { res.json(result) } else { res.send('An error occured while registering your account.') }
        });
    }
});

module.exports = router;