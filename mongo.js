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
  email: { type: String, index: true },
  provider: String,
  id: Number,
  lastSeen: Date,
  name: { type: String, trim: true }
});
userSchema.index({ provider: 1, id: 1 });

const transactionSchema = new mongoose.Schema({
  from: String,
  to: String,
  karma: Number,
  when: { type: Date, default: () => Date.now() }
});

const User = mongoose.model('Users', userSchema);
const Transaction = mongoose.model('Transactions', transactionSchema);

const mongo = {
  findUser: (profile, callback) => {
    User.findOne(
      { provider: profile.provider, id: profile.id },
      (err, res) => callBack(err, res, callback)
    );
  },
  findOrCreateUser: (profile, callback) => {
    const user = User.findOneAndUpdate( 
      { email: profile.emails[0].value },
      { lastSeen: Date.now(), name: profile.displayName },
      { upsert: true },
      (err, res) => callBack(err, res, callback)
    );
  },
  giveKarma: (transaction, callback) => {
    const data = new Transaction(transaction);
    data.save((err, res) => {
      if (!err) {
        User.findOneAndUpdate(
          { email: transaction.to },
          { $inc: { karma: transaction.karma } },
          { upsert: true },
          (err, res) => callBack(err, res, callback)
        )
      }
    });
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
