const express = require('express');
const session = require('express-session');
const Routes = require('./routes');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
const client = redis.createClient();
const cors = require('cors');
const controller = require('./controllers');

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

// We create the namespace conversation which handles only the conversations "chanel"
const conversations = io.of('/conversations');

// We listen to the client's connections and get a socket only for the conversations' chanel
conversations.on('connection', function(socket) {

  // When the user connects we send a room to join (ie : the conversation's id)
  socket.on('choose conversation', function (msg) {
    socket.join(msg.conversationId);
    socket.conversationId = msg.conversationId;
    socket.userId = msg.userId;
    socket.username = msg.username;

    // TODO As the user joined we can add it to the redis database to know that he is online

    // Add a redis variable with the conversation id, the user id and the username to be able to handle the disconnection
    // Add the conversation id
    client.hset(socket.client.id, 'conversationId', msg.conversationId);

    // Add the userId
    client.hset(socket.client.id, 'userId', msg.userId);

    // Add the username
    client.hset(socket.client.id, 'username', msg.username);

    // TODO Do we keep the history of the player's connections ?

    // Warn the conversation that the user has joined the chat
    conversations.to(msg.conversationId).emit('user joined', msg.username);
  });

  // When we chat we redirect the messages to their corresponding conversations
  socket.on('chat message', function(msg) {

    // And then we emit to the right namespace and the right conversation
    conversations.to(msg.conversationId).emit('chat message', msg);

    controller.addMessageToDatabase(msg);
  });

  // When the user disconnects we kill the socket
  socket.on('disconnect', function() {

    let conversationId;
    let username;

    // We create two Promises to get the two values to handle the disconnection

    let promiseArray = [];
    promiseArray.push( new Promise(function (resolve) {
          client.hget(socket.client.id, 'conversationId', function (err, response) {
            conversationId = response;
            resolve(response);
          })
        })
    );

    promiseArray.push( new Promise(function (resolve) {
        client.hget(socket.client.id, 'username', function (err, response) {
          username = response;
          resolve(response);
        })
      })
    );

    // We wait the end of all the promises to emit and delete the variable on redis
    Promise.all(promiseArray).then(function () {

      // Emit that a user has been disconnected
      conversations.to(conversationId).emit('user quit', username);

      // Remove the socket data from the redis server after getting all the information needed
      client.del(socket.client.id);
    });

    // Kill the socket
    socket.disconnect();
  });
});

console.log("waiting on localhost:" + port);

module.exports.io = io;