var express         = require('express');
var nunjucks        = require('nunjucks');
var passport        = require('passport');
var GoogleStrategy  = require('passport-google-oauth').OAuth2Strategy;
var mongo           = require('./mongo.js');
var config          = require('./config.js');
var app             = express();


// console.log(config.get('googleCallbackHost'));

// process.exit(0)

passport.use(new GoogleStrategy({
    clientID: config.get('googleClientID'),
    clientSecret: config.get('googleClientSecret'),
    callbackURL: config.get('googleCallbackHost') + '/auth/google/callback' //
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

app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'nunj');

nunjucks.configure('views', {
    autoescape: true,
    watch: true,
    express: app,
});

app.get('/', function(req, res) {
  if (req.isAuthenticated()) {
    var show = {
      name: req.user.name.givenName,
      karma: 0 //TODO
    }
    res.render('index', show);
  } else {
    res.render('index');
  }
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
    return next();
  } else {
    res.redirect('/login');
  }
}

app.listen(config.get('port'), function() {
  console.log("Node app is running at localhost:" + config.get('port'))
});
