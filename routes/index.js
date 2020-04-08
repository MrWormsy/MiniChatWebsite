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

module.exports = router;
