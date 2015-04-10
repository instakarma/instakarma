const express         = require('express');
const nunjucks        = require('nunjucks');
const passport        = require('passport');
const GoogleStrategy  = require('passport-google-oauth').OAuth2Strategy;
const morgan          = require('morgan');
const cookieParser    = require('cookie-parser');
const bodyParser      = require('body-parser');
const session         = require('express-session');
const favicon         = require('serve-favicon');

const mongo           = require('./mongo.js');
const config          = require('./config.js');

const app             = express();

passport.use(new GoogleStrategy({
    clientID: config.get('googleClientID'),
    clientSecret: config.get('googleClientSecret'),
    callbackURL: config.get('googleCallbackHost') + '/auth/google/callback' //
  },
  (accessToken, refreshToken, profile, done) => {
    console.log(profile);
    mongo.findOrCreateUser(profile, done);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

if (config.get('env') == 'development') {
  app.use(morgan('dev'));
}
else {
  app.use(morgan('common'));
}

app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));

app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(express.static('public'));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'nunj');

nunjucks.configure('views', {
    autoescape: true,
    watch: config.get('env') == 'development',
    express: app,
});

// adds the user object to the responses 'locals' object
// this is automatically available to templates
function userObjectMiddleware(req, res, next) {
  if (req.isAuthenticated()) {
    mongo.findUser(req.user, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        res.locals.user = data;
      }
      next();
    });
  } else {
    next();
  }
}

app.use(userObjectMiddleware);

app.get('/', (req, res) => res.render('index'));

app.get('/login', (req, res) => {
  res.send('<a href="/auth/google">Google</a>');
});

app.post('/gief', (req, res) => {
  const transaction = {
    to: req.body.to,
    from: res.locals.user.email,
    karma: req.body.karma
  } 
  if (transaction.to && transaction.karma > 0) {
    mongo.transact(transaction, (err, data) => {
      if (!err) {
        res.redirect('/');
      } else {
        res.sendStatus(500);
      }
    });
  } else {
    res.sendStatus(400);
  }
});

app.get('/auth/google', 
  passport.authenticate('google', {scope: ['profile', 'email']})
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

app.get('/logout', (req, res) => {
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


app.listen(config.get('port'), () => {
  console.log("Node app is running at localhost:" + config.get('port'));
});
