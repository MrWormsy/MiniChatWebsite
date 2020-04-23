const express = require('express');
const router = express.Router();
const controller = require('../controllers');

// Go to the home page
router.get('/home', (req, res) => {
  controller.goToHome(req, res);
});

// Go to a conversation chat page
router.get('/conversation/:id', (req, res) => {
  controller.goToConversation(req, res);
});

// If we have the root route we send the person to /home
router.get('/', (req, res) => {
  controller.goToHome(req, res);
});

// Go to the user's profile page
router.get('/profile', (req, res) => {
  controller.goToProfile(req, res);
});

// Sign up page
router.get('/signup', (req, res) => {
  controller.goToSignUp(req, res);
});

// Post for the route signup
router.post('/signup', (req, res) => {
  controller.signUpPerson(req, res);
});

// Log in page
router.get('/login', (req, res) => {
  controller.goToLogIn(req, res);
});

// Post for the login route
router.post('/login', (req, res) => {
  controller.logInPerson(req, res);
});

// Log Out
router.get('/logout', (req, res) => {
  controller.logOut(req, res);
});

// Check if username exists
router.get('/api/username/:username', (req, res) => {
  controller.getUsername(req, res);
});

// Check if email exists
router.get('/api/email/:email', (req, res) => {
  controller.getEmail(req, res);
});

// Get the conversations the user is in
router.get('/api/conversations/:userid', (req, res) => {
  controller.getUserConversations(req.params.userid).then(function (d) {
    res.json(d);
  })
});

// Get the conversations the user is in
router.get('/api/conversationname/:id', (req, res) => {
  controller.getConversation(req.params.id).then(function (d) {
    res.json(d.name);
  })
});

// Add a user to the conversation
router.post('/api/addfriendtoconversation', (req, res) => {

  // Add the user to the conversation
  controller.addUserToConversation(req.body.friend, req.body.conversationId).then(function (response) {

    // Send the response (done or error)
    res.json(response);

  })
});

// Create a conversation
router.post('/api/createconversation', (req, res) => {

  let users = req.body.users;

  // Here we remove all the spaces and then split by the comma ','
  users = users.replace(/ /g,'');
  let usersList = users.split(",");

  // Add the user to the conversation
  controller.createConversation(req.body.leaderId, usersList, req.body.name).then(function (conversation) {

    // Then we redirect the user to the page of the newly created conversation
    res.json(conversation);

  });
});

// Delete a conversation
router.post('/api/deleteconversation', (req, res) => {

  // We get the conversation id and then send
  let conversationId = req.body.conversationId;

  // Add the user to the conversation
  controller.deleteConversation(conversationId);

  // Then we redirect the user to the page of the newly created conversation
  res.json('done');
});

// Delete a conversation
router.post('/api/renameconversation', (req, res) => {

  // We get the conversation id and then send
  let conversationId = req.body.conversationId;
  let name = req.body.name;

  // Add the user to the conversation
  controller.renameConversation(conversationId, name);

  // Then we redirect the user to the page of the newly created conversation
  res.json('done');
});

// Get all the 100 last messages of a conversation
router.get('/api/messages/:id', (req, res) => {
  controller.getMessagesFromConversation(req.params.id).then(function (messages) {
    res.json(messages);
  });
});

// Get all the 100 last messages of a conversation
router.get('/api/conversationusernames/:id', (req, res) => {
  controller.getUsernamesOfConversation(req.params.id).then(function (messages) {
    res.json(messages);
  });
});

module.exports = router;
