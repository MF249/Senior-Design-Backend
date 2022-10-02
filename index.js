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

mongoUtil.connectToServer( function( err, client ) {
  if (err) console.log(err);
  app.listen(PORT, () => console.log('Server running on port...'));
});