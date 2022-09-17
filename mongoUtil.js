const { MongoClient } = require("mongodb");
require('dotenv').config();

const Db = process.env.MONGODB_URI;
const client = new MongoClient(Db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var _db;

module.exports = {
    
  connectToServer: function (callback) {
    client.connect(function (err, db) {

      if (db) {
        _db = db.db("AppTest");
        console.log("Successfully connected to MongoDB..."); 
      }
        
      return callback(err);
    });
  },
   
  getDb: function () {
    return _db;
  },
};