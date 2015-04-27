const mongoose = require('mongoose');
const shortid  = require('shortid');
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
  id: String,
  lastSeen: Date,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
  name: { type: String, trim: true }
});
userSchema.index({ provider: 1, id: 1 });

const transactionSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'Users'},
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'Users'},
  karma: Number,
  when: { type: Date, default: () => Date.now() }
});

const beaconSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users'},
  location: { type: [Number], index: '2d' },
  when: { type: Date, default: () => Date.now() }
});

const User = mongoose.model('Users', userSchema);
const Transaction = mongoose.model('Transactions', transactionSchema);
const Beacon = mongoose.model('Beacons', beaconSchema);

const mongo = {
  findUser(user) {
    return User
      .findOne({ email: user.email })
      .populate('friends')
      .exec();
  },

  findOrCreateUser(profile) {
    const email = profile.emails[0].value;
    const avatar = profile.photos[0].value;
    return User.findOneAndUpdate(
      { email: email },
      { lastSeen: Date.now(), name: profile.name.givenName,
        avatar, email, id: shortid.generate() },
      { upsert: true, new: true }
    );
  },

  transact(t) {
    return Promise.all([
      giveKarma(t).then(to => {
        t.to = to._id;
        new Transaction(t).save();
        return to;
      }),
      takeKarma(t)
    ]);
  },

  getTransactions(user, limit, skip) {
    return Transaction
      .find({ $or: [{ from: user._id }, { to: user._id }] })
      .sort('-when')
      .limit(limit)
      .skip(skip)
      .populate({
        path: 'from to',
        select: 'name email avatar -_id'
      });
  },

  getOtherParties(user) {
    return Transaction
      .distinct('to', {$or: [{ from: user._id }, {to: user._id}]})
      .then(ts => 
        User.find(
          { _id: { $in: ts } }, 
          { name: 1, email: 1, avatar: 1} 
        ).sort('lastSeen')
      );
  },

  findBeacon(lat, lon, distanceM) {
    return Beacon
      .find({ 
        location: { $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] }, 
          $maxDistance: distanceM //config?
        }} 
      })
      .populate('user');
  },

  addBeacon(user, lat, lon) {
    return new Beacon({
      user: uid,
      location: [lon, lat]
    }).create;
  }
}

function takeKarma(transaction) {
  return User.findOneAndUpdate(
    { _id: transaction.from }, 
    { $inc: { karma: -transaction.karma } }
  );
}

function giveKarma(transaction) {
  return User.findOneAndUpdate(
    { email: transaction.to },
    { $inc: { karma: transaction.karma } },
    { upsert: true }
  );   
}

module.exports = mongo;
