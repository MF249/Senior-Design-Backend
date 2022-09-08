const express = require('express');
const {MongoClient} = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = 5000;  
const app = express();

app.set('port', PORT);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

require('dotenv').config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

var api = require('./api.js');
api.setApp(app, client);

app.use((req, res, next) => 
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});

//app.listen(5000); // start Node + Express server on port 5000
app.listen(PORT, () => 
{
    console.log('Server listening on port ' + PORT);
});