const express = require('express');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api.js');
const cors = require('cors');
var mongoUtil = require('./mongoUtil');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json()); 
app.use('/api', apiRoutes);
app.use(cors());

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