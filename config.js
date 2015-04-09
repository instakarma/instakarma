var convict = require('convict');

// Slightly lol. See https://github.com/mozilla/node-convict#faq
function cantBeBlank(e) {
  if (e === "") { throw new Error("Config value can't be empty!"); } 
}

var conf = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development'],
    default: 'development',
    env: 'NODE_ENV',
    arg: 'env'
  },

  ip: {
    doc: 'The IP address to bind.',
    format: 'ipaddress',
    default: '127.0.0.1',
    env: 'IP_ADDRESS'
  },

  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },

  host: {
    doc: 'The self host',
    format: String,
    default: '127.0.0.1'
  },

  mongoUri: {
    doc: 'URI to connect to mongdb instance',
    format: String,
    default: 'mongodb://localhost/test',
    env: 'MONGOLAB_URI'
  },

  googleCallbackHost: {
    doc: 'Callback host verified by google',
    format: String,
    default: "",
    env: 'CALLBACK_HOST'
  },

  googleClientID: {
    doc: 'Client ID assigned by google to the app',
    format: cantBeBlank,
    default: "",
    env: 'GOOGLE_CLIENT_ID'
  },

  googleClientSecret: {
    doc: 'Client secret assigned by google to the app',
    format: cantBeBlank,
    default: "",
    env: 'GOOGLE_CLIENT_SECRET'
  }
});

try {
  conf.loadFile("./secrets.json");
}
catch (e) {
  // no secrets file. That's OK. It'll use the env vars then
}

// If we need a file with config for dev/test/whatevs, we can load it
// and merge it with the other settings like so:
// var env = conf.get('env');
// conf.loadFile('./config/' + env + '.json');

conf.validate();

if (conf.get('googleCallbackHost') === "") {
  conf.set('googleCallbackHost', 'http://' + conf.get('host') + ':' + conf.get('port'));
}

module.exports = conf;
