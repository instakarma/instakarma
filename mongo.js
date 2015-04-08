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
  username: { type: String, trim: true },
  karma: { type: Number, default: 0 },
  auth: {
    provider: String,
    id: Number
  }
});

var User = mongoose.model('Users', userSchema);

var providerQuery = '{"auth.provider": provider, "auth.id": id}';

var mongo = {
  getUser: function(provider, id, cb) {
    User.findOne(providerQuery, function(err, result) {
      if (!err) {
        cb(result);
      } else {
        cb(null);
      }
    });
  },
  setName: function(provider, id, username, cb) {
    User.update(providerQuery, {username: username}, {upsert: true}, function(err) {
      if (!err) {
        cb(username);
      } else {
        cb(null);
      }
    });
  }
}

module.exports = mongo;
