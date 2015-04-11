const express         = require('express');
const nunjucks        = require('nunjucks');
const passport        = require('passport');
const GoogleStrategy  = require('passport-google-oauth').OAuth2Strategy;
const morgan          = require('morgan');
const cookieParser    = require('cookie-parser');
const bodyParser      = require('body-parser');
const session         = require('express-session');
const favicon         = require('serve-favicon');
const moment          = require('moment');

const mongo           = require('./mongo.js');
const config          = require('./config.js');

const app             = express();

passport.use(new GoogleStrategy({
    clientID: config.get('googleClientID'),
    clientSecret: config.get('googleClientSecret'),
    callbackURL: config.get('googleCallbackHost') + '/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    mongo
      .findOrCreateUser(profile)
      .then(e => done(null, e), done);
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
    mongo
      .findUser(req.user)
      .then(e => res.locals.user = e)
      .then(null, e => console.log("findUser error:", e))
      .then(e => next());
  } else {
    next();
  }
}

app.use(userObjectMiddleware);

app.get('/', (req, res) => res.render('index'));

app.get('/login', (req, res) => {
  res.render('login', { returnPath: req.query.returnPath });
});

app.post('/gief', (req, res) => {
  const transaction = {
    to: req.body.to,
    from: res.locals.user.email,
    karma: req.body.karma
  } 
  if (transaction.to && transaction.karma > 0) {
    // note: should've used .catch on promise, but not supperted. see
    // https://github.com/aheckmann/mpromise/issues/15
    mongo
      .transact(transaction)
      .then((e => res.redirect('/me')), (e => res.status(500).send(e)));
  } else {
    res.sendStatus(400);
  }
});

app.get('/auth/google', 
  (req, res, next) => {
    req.session.returnPath = req.query.returnPath;
    next();
  },
  passport.authenticate('google', {scope: ['profile', 'email']})
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  (req, res, next) => {
    if (req.session.returnPath) {
      const rp = req.session.returnPath;
      req.session.returnPath = null;
      res.redirect(rp);
    } else {
      res.redirect('/me');
    }
    next();
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login?returnPath=' + escape(req.originalUrl));
  }
}

app.get('/me', ensureAuthenticated, (req, res) => {
  mongo
    .getTransactions(res.locals.user)
    .then(dts => toViewTransactions(res.locals.user, dts))
    .then(vts => 
      res.render('me', {
        friends: [
          {name: "Frank", email: "frank@example.org"},
          {name: "Sverre", email: "sverre@example.org"},
          {name: "David", email: "david@example.org"},
          {name: "Kåre", email: "kaare@example.org"},
          {name: "Nina", email: "nina@example.org"},
        ],
        transactions: vts
      })
    );
});

function toViewTransactions(user, dbTransactions) {
  return dbTransactions.map((t) => {
    var direction = 'got';
    if (t.from === user.email) {
      direction = 'gave';
    }
    const fromNow = moment(t.when).fromNow()
    return {direction: direction, to: t.to, from: t.from, amount: t.karma, ago: fromNow};
  });
}

app.listen(config.get('port'), () => {
  console.log("Node app is running at localhost:" + config.get('port'));
});
