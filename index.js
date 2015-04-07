var express         = require('express');
var passport        = require('passport');
var GoogleStrategy  = require('passport-google-oauth').OAuth2Strategy;
var mongo           = require('./mongo.js')
var app             = express();

app.set('port', (process.env.PORT || 3000));

var callbackHost        = process.env.CALLBACK_HOST || ('http://127.0.0.1:' + app.get('port'));
var googleClientID      = process.env.GOOGLE_CLIENT_ID;
var googleClientSecret  = process.env.GOOGLE_CLIENT_SECRET;

passport.use(new GoogleStrategy({
    clientID: googleClientID,
    clientSecret: googleClientSecret,
    callbackURL: callbackHost + '/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var morgan = require('morgan');
app.use(morgan('tiny'));

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var session = require('express-session');
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res){
  res.send('instakarma');
});

app.get('/account', ensureAuthenticated, function(req, res) {
  res.send({ user: req.user });
});

app.get('/newuser', function(req, res) {
  if (req.isAuthenticated()) {
    res.send(
      '<form action="/newuser" method="POST">' +
        '<label for="uname">Username</label>' +
        '<input id="uname" name="uname" type="text"/>' +
        '<input type="submit" value="Submit">' +
      '</form>');
  } else {
    res.redirect("/login");
  }
});

app.post('/newuser', function(req, res) {
  if (req.isAuthenticated()) {
    if (req.body.uname) {
      mongo.setName(req.user.provider, req.user.id, req.body.uname, function(user) {
        if (!user) {
          res.sendStatus(500);
        } else {
          res.redirect('/users/' + user);
        }
      });
    } else {
      res.sendStatus(403);
    }
  }
});

app.get('/users/:username', ensureAuthenticated, function(req, res) {
  var user = req.suchkarma.user;
  res.send(user.username + ': ' + user.karma);
});

app.get('/users/:username/give', ensureAuthenticated, function(req, res) {
  res.sendStatus(204)
});

app.get('/login', function(req, res){
  res.send('<a href="/auth/google">Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login']})
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

app.get('/logout', function(req, res){
  req.suchkarma = null;
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    mongo.getUser(req.user.provider, req.user.id, function(user) {
      if (user) {
        req.suchkarma = { user: user };
        return next();
      } else {
        res.redirect('/newuser');
      }
    });
  } else {
    res.redirect('/login');
  }
}

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
