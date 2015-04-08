var mongoose = require ("mongoose");

var uristring =
  process.env.MONGOLAB_URI ||
  'mongodb://localhost/test';

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
  findOrCreateUser: function(profile, callback) {
    User.findOneAndUpdate(
      { provider: profile.provider, id: profile.id },
      { lastSeen: Date.now(), name: profile.name.givenName },
      { upsert: true },
      function(err, res) { toCallback(err, res, callback) }
    );
  }
}

function toCallback(err, res, callback) {
  if (!err) {
    callback(null, res);
  } else {
    callback(err, null);
  }
}

module.exports = mongo;
