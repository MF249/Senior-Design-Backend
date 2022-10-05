const express = require('express');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;
const apiRoutes = require('./routes/api.js');
var mongoUtil = require('./mongoUtil');

const app = express();

app.use(bodyParser.json()); 
app.use('/api', apiRoutes);

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

mongoUtil.connectToServer( function( err, client ) {
    if (err) console.log(err);
    app.listen(PORT, () => console.log('Server running on port...'));
});