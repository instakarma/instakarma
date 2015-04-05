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
  username: { type: String, trim: true },
  karma: { type: Number, default: 0 },
  auth: {
    provider: String,
    id: Number
  }
});

var User = mongoose.model('Users', userSchema);

var mongo = {
  getUser: function(provider, id, cb) {
    var auth = '{"auth.provider": provider, "auth.id": id}';
    User.findOne(auth, function(err, result) {
      if (!err) {
        cb(result);
      } else {
        cb(null);
      }
    });
  },
  setName: function(provider, id, username) {
    var which = {'auth.provider': provider, 'auth.id': id};
    User.update(which, {username: username}, {upsert: true}, function(err) {
      if (!err) {
        return username;
      }
      return null;
    });
  }
}

module.exports = mongo;
