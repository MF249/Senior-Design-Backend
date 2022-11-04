const express = require('express');
const router = express.Router();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt  = require('jsonwebtoken');
const mongoUtil = require('../mongoUtil');
const sgMail = require('@sendgrid/mail');
const User = require('../models/newUser.js');
const Activity = require('../models/newActivity.js');
const Img = require('../models/newPhoto');
const newActivity = require('../models/newActivity.js');
const { MongoDBNamespace } = require('mongodb');
const { default: mongoose } = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
var fs = require('fs'); 
const path = require('path');
//var photo = require('../images/image0010.jpg');

router.use(cors());
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname,'./uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

var upload = multer({ storage: storage });

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
            console.log('Email successfully sent!');
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
            console.log('Email successfully sent!');
        }).catch((error) => {
            res.send(error);
        });

        await db_connect.collection("Users").updateOne(
            {_id: emailExist._id}, 
            {$set: {verifyPIN: pin}}
        );
        res.send({ 'message' : 'Email successfully sent!' });
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

router.post('/addPhoto', upload.single('file'), function (req, res) {
    let db_connect = mongoUtil.getDb("AppTest");
    var date = new Date();
    var new_img = new Img;
    new_img.img.data = fs.readFileSync(req.file.path)
    //console.log(req.body);
    new_img.img.contentType = 'image/jpg';
    new_img.date = date;
    new_img.name = req.file.filename;
    db_connect.collection("LiveFeed").insertOne(new_img, function (err, result) {
        if (err) throw err;
        if (result) { res.json(result) } else { res.send({ 'message' : 'An error occured while updating the LiveFeed table.' }) }
    }); 
    
    res.json({ message: 'New image added to the db!' });
}).get('/getPhoto', function (req, res) {
    let db_connect = mongoUtil.getDb("AppTest");
    
    db_connect.collection("LiveFeed").findOne(Img, function (err, img) {
        if (err)
            res.send(err);        
            
        console.log(img);        
        res.contentType('json');
        res.send(img);
    }); 
    
    console.log(img);  
    res.json({ message: 'Image was retrieved.' });
});


/*router.get('/getPhoto', function (req, res) {
    let db_connect = mongoUtil.getDb("AppTest");
    
    db_connect.collection("LiveFeed").findOne({}, function (err, result) {
        if (err)
            res.send(err);        
            console.log(img);        
        res.contentType('json');
        res.send(img);
    }).sort({ 
        createdAt: 'desc' 
    });  
    
    res.json({ message: 'Image was retrieved.' });
});*/

module.exports = router;