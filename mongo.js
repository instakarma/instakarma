const mongoose = require ('mongoose');
const config   = require('./config.js');

const uristring = config.get('mongoUri');

mongoose.connect(uristring, (err, res) => {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});

const ObjectId = mongoose.Types.ObjectId;

const userSchema = new mongoose.Schema({
  karma: { type: Number, default: 0 },
  uid: { type: String, default: new ObjectId, index: true },
  provider: String,
  id: Number,
  lastSeen: Date,
  name: { type: String, trim: true }
});

userSchema.index({ provider: 1, id: 1 });

const User = mongoose.model('Users', userSchema);

const providerQuery = '{"auth.provider": provider, "auth.id": id}';

const mongo = {
  findUser: (profile, callback) => {
    User.findOne(
      { provider: profile.provider, id: profile.id },
      (err, res) => callBack(err, res, callback)
    );
  },
  findOrCreateUser: (profile, callback) => {
    User.findOneAndUpdate(
      { provider: profile.provider, id: profile.id },
      { lastSeen: Date.now(), name: profile.name.givenName },
      { upsert: true },
      (err, res) => callBack(err, res, callback)
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
