var express         = require('express');
var passport        = require('passport');
var GoogleStrategy  = require('passport-google-oauth').OAuth2Strategy;
var app             = express();

app.set('port', (process.env.PORT || 3000));

var callbackHost        = process.env.CALLBACK_HOST || 'http://127.0.0.1:3000';
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

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res){
  res.send('instakarma');
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.send({ user: req.user });
});

app.get('/login', function(req, res){
  res.redirect('/auth/google');
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
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
