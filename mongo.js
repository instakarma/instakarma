var mongoose = require ('mongoose');
var config   = require('./config.js');

var uristring = config.get('mongoUri');

mongoose.connect(uristring, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});

var userSchema = new mongoose.Schema({
  karma: { type: Number, default: 0 },
  provider: String,
  id: Number,
  lastSeen: Date,
  name: { type: String, trim: true }
});

var User = mongoose.model('Users', userSchema);

var providerQuery = '{"auth.provider": provider, "auth.id": id}';

var mongo = {
  findUser: function(profile, callback) {
    User.findOne(
      { provider: profile.provider, id: profile.id },
      function(err, res) { callBack(err, res, callback) }
    );
  },
  findOrCreateUser: function(profile, callback) {
    User.findOneAndUpdate(
      { provider: profile.provider, id: profile.id },
      { lastSeen: Date.now(), name: profile.name.givenName },
      { upsert: true },
      function(err, res) { callBack(err, res, callback) }
    );
  }
}

function callBack(err, res, callback) {
  if (!err) {
    callback(null, res);
  } else {
    callback(err, null);
  }
}

module.exports = mongo;
