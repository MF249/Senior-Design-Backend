const express = require('express');
const mongoUtil = require('../mongoUtil');
const sgMail = require('@sendgrid/mail');
const User = require('../models/newUser.js');
const ObjectID = require('mongodb').ObjectID;

require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const router = express.Router();

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
    let myquery = { username: username, password: password };
    db_connect.collection("Users").findOne(myquery, function (err, result) {
        if (err) throw err;
        if (result) { res.json(result) } else { res.send('Incorrect username/password entered.') }
    });
});

router.post('/register', async (req, res) => {
    
    const newUser = new User ({
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email
    });

    let db_connect = mongoUtil.getDb("AppTest");
    let userQuery = { username: req.body.username };
    let emailQuery = { email: req.body.email };
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

router.post('/sendTest', async (req, res) => {
        
    email = req.body.email;

    let db_connect = mongoUtil.getDb("AppTest");
    let emailQuery = { email: req.body.email };
    const emailExist = await db_connect.collection("Users").find(emailQuery).toArray();

    if (emailExist.length = 0) {
        res.send('This email does not have a valid account.');
    }

    const msg = {
        to: email,
        from: 'liveboltsmartlock@gmail.com',
        subject: 'Send Test',
        text: 'Hello, world.',
    };

    sgMail.send(msg).then(() => {
        console.log('Email successfully sent!');
        res.send('Email successfully sent!');
    }).catch((error) => {
        console.error(error);
    });
});

router.post('/sendVerifyEmail', async (req, res) => {
        
    userId = req.body.id;

    let db_connect = mongoUtil.getDb("AppTest");
    let userQuery = { _id: new ObjectID(userId) };
    const userExist = await db_connect.collection("Users").findOne(userQuery);

    if (!userExist) {
        res.send('An error occured when creating your account. Please try again.');
    } else if (userExist.emailConfirm == 1) {
        res.send('This account has already been verified.');
    } else {
        
        const pin = Math.floor(100000 + Math.random() * 900000);

        const msg = {
            to: userExist.email,
            from: 'liveboltsmartlock@gmail.com',
            substitutionWrappers: ['{{', '}}'],
            dynamicTemplateData: {
                name: `${userExist.name}`,
                code: `${pin}`
            },
            templateId: 'd-1419eed499ef422c9b57f06653275dc4',
        }
    
        sgMail.send(msg).then(() => {
            console.log('Email successfully sent!');
        }).catch((error) => {
            res.send(error);
        });

        await db_connect.collection("Users").updateOne(
            {_id: userExist._id}, 
            {$set: {verifyPIN: pin}}
        );
        res.send('Email successfully sent!');
    }
});

module.exports = router;