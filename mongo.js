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
  avatar: String,
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
  findUser: (user, callback) => {
    User.findOne(
      { email: user.email },
      (err, res) => callBack(err, res, callback)
    );
  },
  findOrCreateUser: (profile, callback) => {
    const email = profile.emails[0].value;
    const avatar = profile.photos[0].value;
    const user = User.findOneAndUpdate( 
      { email: email },
      { lastSeen: Date.now(), name: profile.displayName, avatar, email },
      { upsert: true },
      (err, res) => callBack(err, res, callback)
    );
  },
  transact: (transaction, callback) => {
    const trans = new Transaction(transaction);
    trans.save((err, data) => {
      if (!err) {
        giveKarma(transaction, (err, res) => {
          if (!err) {
            takeKarma(transaction, (err, res) => callBack(err, data, callback));
          } else {
            callback(err, null);
          }
        });
      } else {
        callback(err, null);
      }
    });
  }
}

function takeKarma(transaction, callback) {
  User.update(
    { email: transaction.from }, 
    { $inc: { karma: -transaction.karma } },
    (err, res) => callBack(err, res, callback)
  );
}

function giveKarma(transaction, callback) {
  User.update(
    { email: transaction.to },
    { $inc: { karma: transaction.karma } },
    { upsert: true },
    (err, res) => callBack(err, res, callback)
  );   
}

function callBack(err, res, callback) {
  if (!err) {
    callback(null, res);
  } else {
    callback(err, null);
  }
}

module.exports = mongo;
