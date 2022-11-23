const express = require('express');
const router = express.Router();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt  = require('jsonwebtoken');
const mongoUtil = require('../mongoUtil');
const sgMail = require('@sendgrid/mail');
const User = require('../models/newUser.js');
const Activity = require('../models/newActivity.js');
const ObjectID = require('mongodb').ObjectID;
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const { serviceconsumermanagement } = require('googleapis/build/src/apis/serviceconsumermanagement');

router.use(cors());
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

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

    let db_connect = mongoUtil.getDb("AppTest");
    let myquery = { username: username };
    db_connect.collection("Users").findOne(myquery, function (err, result) {
        if (err) throw err;
        
        if (result) { 
            let check = bcrypt.compareSync(password, result.password);
            if (check) { 
                
                const token = jwt.sign({ userId: result._id }, process.env.JWT_KEY, {
                    expiresIn: "1h",
                });
                result.token = token;
                res.json(result);
            } else { 
                res.send({ 'message' : 'Incorrect password entered' });
            }
        } else { 
            res.send({ 'message' : 'Incorrect username entered' });
        }
    });
});

router.post('/register', async (req, res) => {

    let hash = await bcrypt.hash(req.body.password, 10);

    const newUser = new User ({
        username: req.body.username,
        password: hash,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        token: -1
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
            if (result) { res.json(result) } else { res.send({ 'message' : 'An error occured while registering your account.' }) }
        });
    }
});

router.post('/sendTest', async (req, res) => {
        
    email = req.body.email;

    let db_connect = mongoUtil.getDb("AppTest");
    let emailQuery = { email: req.body.email };
    const emailExist = await db_connect.collection("Users").find(emailQuery).toArray();

    if (emailExist.length = 0) {
        res.send({ 'message' : 'This email does not have a valid account.' });
    }

    const msg = {
        to: email,
        from: 'liveboltsmartlock@gmail.com',
        subject: 'Send Test',
        text: 'Hello, world.',
    };

    sgMail.send(msg).then(() => {
        res.send({ 'message' : 'Email successfully sent!' });
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
        res.send({"message" : 'An error occured when creating your account. Please try again.', "userId" : "-1"});
    } else if (userExist.emailConfirm == 1) {
        res.send({"message" : 'This account has already been verified.', "userId" : "-1"});
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
            console.log('Account verification email sent');
        }).catch((error) => {
            res.send({ 'message' : error });
        });

        await db_connect.collection("Users").updateOne(
            {_id: userExist._id}, 
            {$set: {verifyPIN: pin}}
        );
        res.send({"message" : 'Email successfully sent!', "userId" : userExist._id});
    }
});

router.post('/sendResetEmail', async (req, res) => {
        
    email = req.body.email;

    let db_connect = mongoUtil.getDb("AppTest");
    let emailQuery = { email: email };
    const emailExist = await db_connect.collection("Users").findOne(emailQuery);

    if (!emailExist) {
        res.send({ 'message' : 'This email account does not have an account associated with it.' });
    } else {
        
        const pin = Math.floor(100000 + Math.random() * 900000);

        const msg = {
            to: emailExist.email,
            from: 'liveboltsmartlock@gmail.com',
            substitutionWrappers: ['{{', '}}'],
            dynamicTemplateData: {
                name: `${emailExist.name}`,
                code: `${pin}`
            },
            templateId: 'd-e88b7d8285ab469398b9d4119c006fdc',
        }
    
        sgMail.send(msg).then(() => {
            console.log('Reset password email sent');
        }).catch((error) => {
            res.send(error);
        });

        await db_connect.collection("Users").updateOne(
            {_id: emailExist._id}, 
            {$set: {verifyPIN: pin}}
        );
        res.send({ 'message' : 'Email successfully sent!', 'userId' : emailExist._id });
    }
});

router.post('/accountVerify', async (req, res) => {
        
    pin = req.body.pin;
    userId = req.body.id;

    let db_connect = mongoUtil.getDb("AppTest");
    let userQuery = { _id: new ObjectID(userId) };
    const userExist = await db_connect.collection("Users").findOne(userQuery);

    if (!userExist) {
        res.send({'message' : 'An error has occured during the verification process. Please try again.'});
    } else {
        
        if (userExist.verifyPIN == pin) {
            await db_connect.collection("Users").updateOne(
                { _id: userExist._id }, 
                {
                    $set: { emailConfirm: 1 },
                    $unset: {verifyPIN: ''}
                }
            );
            res.send({'message' : 'User has been successfully authenticated!'});
        } else {
            res.send({'message' : 'The PIN you have entered is incorrect. Please try again.'});
        }
    }
});

router.post('/resetVerify', async (req, res) => {
        
    pin = req.body.pin;
    userId = req.body.id;

    let db_connect = mongoUtil.getDb("AppTest");
    let userQuery = { _id: new ObjectID(userId) };
    const userExist = await db_connect.collection("Users").findOne(userQuery);

    if (!userExist) {
        res.send({'message' : 'This account does not exist.'});
    } else {
        
        if (userExist.verifyPIN == pin) {
            await db_connect.collection("Users").updateOne(
                { _id: userExist._id }, 
                {
                    $set: { emailConfirm: 1 },
                    $unset: {verifyPIN: ''}
                }
            );
            res.send({'match' : 1});
        } else {
            res.send({'message' : 'Incorrect PIN entered. Please try again.'});
        }
    }
});

router.post('/changePassword', async (req, res) => {
        
    password = req.body.password;
    userId = req.body.id;

    let db_connect = mongoUtil.getDb("AppTest");
    let userQuery = { _id: new ObjectID(userId) };
    let hash = await bcrypt.hash(password, 10);
    const userExist = await db_connect.collection("Users").findOne(userQuery);

    if (!userExist) {
        res.send({'message' : 'This account does not exist.'});
    } else {  
        await db_connect.collection("Users").updateOne({ _id: userExist._id }, 
            { $set: { password: hash }, $unset: {verifyPIN: ''} }
        );
        res.send({'confirm' : 1, 'message' : 'Password successfully reset! Redirecting to login.'});
    }
});

router.post('/profileUser', async (req, res) => {
        
    userId = req.body.id;

    let obj = {};
    let db_connect = mongoUtil.getDb("AppTest");
    let userQuery = { _id: new ObjectID(userId) };
    const userExist = await db_connect.collection("Users").findOne(userQuery);

    if (!userExist) {
        res.send({
            'message' : 'An error has occured trying to retrieve your profile. Please try again.'
        });
    } else {
        
        obj = { 
            'username' : userExist.username,
            'name' : userExist.name,
            'email' : userExist.email,
            'phone' : userExist.phone
        };

        res.send(obj);
    }
});

router.post('/addActivity', async (req, res) => {

    let timestamp = req.body.timestamp;
    let lockStatus = req.body.status;
    let text = req.body.text;
    let userId = req.body.id;
    
    var fields = timestamp.split(',');
    let date = fields[0];
    let time = fields[1];
    
    var pnumber;
    var bodyText;

    let db_connect = mongoUtil.getDb("AppTest");
    let dateQuery = { 'date' : date };
    db_connect.collection("ActivityLog").findOne(dateQuery).then((response) => {
        if (response) {
            console.log('Database entry found...');
            if (lockStatus === '1') {
                bodyText = "Live Bolt Activity: Your door was locked at" + time;
                db_connect.collection("ActivityLog").updateOne({ date: response.date }, {
                    $push: { lockTime: { time : time, toggle : 1 } }, $set: { activityStatus : 1 }
                }, function (err, result) {
                    if (err) throw err;
                    console.log('Updating log...');
                    if (!result) { res.send({ 'message' : 'An error occured while updating the activity log.' }) }
                });

            } else if (lockStatus === '-1') {
                bodyText = "Live Bolt Activity: Your door was unlocked at" + time;
                db_connect.collection("ActivityLog").updateOne({ date: response.date }, {
                    $push: { lockTime: { time : time, toggle : -1 } }, $set: { activityStatus : -1 },
                }, function (err, result) {
                    if (err) throw err;
                    console.log('Updating log...');
                    if (!result) { res.send({ 'message' : 'An error occured while updating the activity log.' }) }
                });

            } else {
                res.send({ 'message' : 'Error: unauthorized lock status' });
            }

        } else {
            console.log('Database entry not found...');
            if (lockStatus === '1') {
                newActivity = new Activity ({
                    date: date,
                    lockTime: [{ time : time, toggle : 1 }],
                    activityStatus: 1
                });
                bodyText = "Live Bolt Activity: Your door was locked at" + time;

            } else if (lockStatus === '-1') {
                newActivity = new Activity ({
                    date: date,
                    lockTime: [{ time : time, toggle : -1 }],
                    activityStatus: -1
                });
                bodyText = "Live Bolt Activity: Your door was unlocked at" + time;

            } else { 
                console.log('Lock status error...');
                res.send({ 'message' : 'Error: unauthorized lock status' });
            }

            db_connect.collection("ActivityLog").insertOne(newActivity, function (err, result) {
                if (err) throw err;
                console.log('Inserting log object...');
                if (!result) { res.send({ 'message' : 'An error occured while updating the activity log.' }) }
            });
        }
    });

    if (text) {
        let userQuery = { _id: new ObjectID(userId) };
        db_connect.collection("Users").findOne(userQuery, function (err, result) {
            if (err) throw err;
            console.log('Phone number found...');
            if (!result) { res.send({ 'message' : 'An error has occured sending text alerts to your number.' }) }
            
            pnumber = "+1" + result.phone;
            client.messages.create({
                body: bodyText, 
                from: '+17087428465', 
                to: pnumber
            }).done();
            console.log('SMS sent!');
            res.send({ 'message' : 'Activity log successfully updated! Text sent to user.'});
        });
    } else {
        console.log('Text messages disabled...');
        res.send({ 'message' : 'Activity log successfully updated!' })
    }
});

router.post('/getActivity', async (req, res) => {

    let date = req.body.date;
    let obj = {};

    let db_connect = mongoUtil.getDb("AppTest");
    let dateQuery = { 'date' : date };
    db_connect.collection("ActivityLog").findOne(dateQuery).then((response) => {
        if (response) {
            obj.lockTime = response.lockTime;
            res.send(obj);
        } else {
            res.send({'message' : 'No activity occured on this date.'});
        }
    });
});

router.post('/textUser', async (req, res) => {

    let userId = req.body.id;
    var userPhone;

    let db_connect = mongoUtil.getDb("AppTest");
    let userQuery = { _id: new ObjectID(userId) };
    const userExist = await db_connect.collection("Users").findOne(userQuery);

    if (!userExist) {
        res.send({
            'message' : 'An error has occured trying to retrieve your profile. Please try again.'
        });
    } else { userPhone = userExist.phone }

    let pnumber = "+1" + userPhone;
    client.messages.create({
        body: 'Testing Text Message API...', 
        from: '+17087428465', 
        to: pnumber
    }).then(res.send("SMS sent to " + pnumber));
});

router.get('/getCamFeed', async (req, response) => {
    const SCOPES = ['https://www.googleapis.com/auth/drive'];
    const TOKEN_PATH = path.join(process.cwd(), 'token.json');
    const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

    async function loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(TOKEN_PATH);
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        } catch (err) {
            return null;
        }
    }

    async function saveCredentials(client) {
        const content = await fs.readFile(CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        await fs.writeFile(TOKEN_PATH, payload);
    }

    async function authorize() {
        let client = await loadSavedCredentialsIfExist();
        if (client) {
            return client;
        }
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });
        if (client.credentials) {
            await saveCredentials(client);
        }
        return client;
    }

    async function listFiles(authClient) {
        const drive = google.drive({version: 'v3', auth: authClient});
        const res = await drive.files.list({
            fields: 'nextPageToken, files(webViewLink)',
        });

        const files = res.data.files;
        if (files.length === 0) {
            console.log('No capture images found.');
            return;
        }

        console.log(res.data);

        response.send(res.data);

    }

    authorize().then(listFiles).catch(console.error);
});

module.exports = router;