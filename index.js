const express = require('express');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api.js');
var mongoUtil = require('./mongoUtil');

const app = express();
const PORT = 5000;

app.use(bodyParser.json()); 
app.use('/api', apiRoutes);

mongoUtil.connectToServer( function( err, client ) {
  if (err) console.log(err);
  app.listen(PORT, () => console.log('Server running on port 5000...'));
});