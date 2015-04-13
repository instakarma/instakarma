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
  findUser(user) {
    return User.findOne({ email: user.email });
  },

  findOrCreateUser(profile) {
    const email = profile.emails[0].value;
    const avatar = profile.photos[0].value;
    return User.findOneAndUpdate(
      { email: email },
      { lastSeen: Date.now(), name: profile.name.givenName, avatar, email },
      { upsert: true }
    );
  },

  transact(transaction) {
    const transTo = new Transaction(transaction);
    const transFrom = new Transaction({
      from: transaction.to,
      to: transaction.from,
      karma: -transaction.karma
    });
    return Promise.all([
      transTo.save().then(e => updateKarma(transTo)),
      transFrom.save().then(e => updateKarma(transFrom))
    ]);
  },

  getTransactions(user) {
    return Transaction
      .find({ from: user.email })
      .sort('-when')
      .limit(5);
  },

  getOtherParties(user) {
    return Transaction
      .distinct('to', { from: user.email })
      .then(to => User
        .find({ email: { $in: to } }, { _id: 0, name: 1, email: 1 })
        .limit(10)
        .sort('lastSeen')
      );
  }
}

function updateKarma(transaction) {
  return User.update(
    { email: transaction.to },
    { $inc: { karma: transaction.karma } },
    { upsert: true }
  );   
}

module.exports = mongo;
