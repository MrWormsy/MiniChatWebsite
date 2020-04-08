const express = require('express');
const session = require('express-session');
const Routes = require('./routes');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const client = redis.createClient();
const cors = require('cors');

// We create the app as well as the server and the io part
const app = express();
let port = 3000;
const server = require('http').Server(app).listen(port);
const io = require('socket.io')(server);

// Not to have problems with cors...
app.use(cors());
app.options('*',cors());
var allowCrossDomain = function(req,res,next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}
app.use(allowCrossDomain);




// Session part
app.use(session({
  secret: 'INFO834',
  store: new redisStore({host: 'localhost', port: 6379, client: client, ttl: 86400}),
  saveUninitialized: false,
  resave: false
}));

// Parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));

// We use the body parser as json
app.use(bodyParser.json());

// Set the routes path
app.use(Routes);

// MongoDB
const mongoose = require('mongoose');
database = 'mongodb://localhost:27017/chat';
mongoose.connect(database, (err) => {
  if (err)
    throw err;
  console.log('Connect to the database');
});

// Path and Views
const path = require('path');
let dirViews = [path.join(__dirname, './views')];
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', dirViews);
app.set('view engine', 'ejs');

const conversations = io.of('/conversations');

conversations.on('connection', function(socket) {

  socket.on('choose conversation', function (msg) {
    socket.join(msg);
  });

  socket.on('chat message', function(msg) {
    conversations.to(msg.conversationId).emit('chat message', msg);
  });

  socket.on('disconnect', function() {
    socket.disconnect();
  });
});

console.log("waiting on localhost:" + port);

module.exports.io = io;