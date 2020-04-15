const mongoose = require('mongoose');

// Go to Home
function goToHome(req, res) {
    res.render('index', {page : 'home', session: req.session, conversations: null});


    //createConversation('5e8dd22bc7f6866dad8e33b7', [new RegExp(["^", "PRout", "$"].join(""), "i"), new RegExp(["^", "Tamer", "$"].join(""), "i"), new RegExp(["^", 'Coucou', "$"].join(""), "i")], "MERDE");

}


// Go to profile
function goToProfile(req, res) {
    // If the person is not logged in we redirect to home
    if (typeof req.session.username === 'undefined') {
        res.redirect('/');
        // Otherwise we display the profile page
    } else {
        // We render the profile with all the user's information
        const Models = require('../models');

        let regex = new RegExp(["^", req.session.username, "$"].join(""), "i");

        Models.User.find({username: regex}, function (err, user) {
            if (err) throw err;
            res.render('index', {page : 'profile', session: req.session, user: user[0]});
        });
    }
}

// Go to a conversation page
function goToConversation(req, res) {

    // If the person is not logged in we redirect to home
    if (typeof req.session.username === 'undefined') {
        res.redirect('/');
        // Otherwise we display the profile page
    } else {
        // TODO WE NEED TO CHECK THAT THIS PERSON IS IN THIS CONVERSATION !!!!!!!

        // Here we check that this player is trying to access a conversation he belongs in
        userBelongsToTheConversation(req.params.id, req.session.userid).then(function (response) {

            // If the user belongs to the conversation we can render the page
           if (response) {
               // We render the page with the last conversation
               res.render('index', {page : 'conversation', session: req.session, conversationid: req.params.id});
           }

           // Else we redirect him to the home page...
           else {
               res.redirect('/');
           }
        });
    }
}

// Go to the signup page
function goToSignUp(req, res) {
    // If the person is already logged in we redirect him to the home page
    if (typeof req.session.username !== 'undefined') {
        res.redirect('/home');
        // Else he can sign in
    } else {
        res.render('index', {page : 'signup', session: req.session});
    }
}

// Sign the person in
function signUpPerson(req, res) {
    const crypto = require('crypto');

    const Models = require('../models');

    // Here we check that all the fields are not undefined
    if ((!(req.body.pass)) || (!(req.body.passconf)) || (!(req.body.username)) || (!(req.body.email))) {
        res.end('error');
        return;
    }

    let pass = crypto.createHash('md5').update(req.body.pass).digest("hex");

    // Some tests made client side but the person can just post...
    if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email))) {
        res.end('error');
    }

    if (req.body.username.length < 3) {
        res.end('error');
    }

    if (getPasswordStrength(req.body.pass) === 0) {
        res.end('error');
    }

    if (req.body.pass !== req.body.passconf) {
        res.end('error');
    }

    let regex = new RegExp(["^", req.body.email, "$"].join(""), "i");

    Models.User.find({email: regex}, function (err, email) {
        if (err) throw err;
        if (email.length !== 0) {
            res.end('error');
        } else {
            regex = new RegExp(["^", req.body.username, "$"].join(""), "i");

            Models.User.find({username: regex}, function (err, username) {

                if (err) throw err;
                if (username.length !== 0) {
                    res.end('error');
                } else {

                    // create an account
                    const newAccount = Models.User({
                        username: req.body.username,
                        password: pass,
                        email: req.body.email
                    });

                    newAccount.save(function (err, object) {
                        if (err) throw err;

                        //Store user's username into session
                        req.session.username = req.body.username;
                        req.session.userid = object._id;

                        res.end('done');
                    });
                }
            });
        }
    });

    //  curl -d 'username=MrWo&email=a@a.z&pass=anto1998&passconf=anto1998' localhost/signup
}

// Go to the log in page
function goToLogIn(req, res) {
    // If the person is already logged in we redirect him to the home page
    if (typeof req.session.username !== 'undefined') {
        res.redirect('/home');
        // Else he can log in
    } else {
        res.render('index', {page : 'login', session: req.session});
    }
}

// Log the person in
function logInPerson(req, res) {
    const crypto = require('crypto');
    let pass = crypto.createHash('md5').update(req.body.pass).digest("hex");

    const Models = require('../models');

    let regex = new RegExp(["^", req.body.username, "$"].join(""), "i");

    //Find user's username and password
    Models.User.find({username: regex, password: pass}, function (err, result) {
        if (err) throw err;

        // If we get a result this means this username with this hashed password exists
        if (result.length === 1) {
            req.session.username = result[0].username;
            req.session.userid = result[0]._id;
            res.end('done');
        } else {
            res.end('error');
        }
    });
}

// Log Out the person
function logOut(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
}

// /^bar$/i

// Get a user from its username
function getUsername(req, res) {
    const Models = require('../models');

    let regex = new RegExp(["^", req.params.username, "$"].join(""), "i");

    Models.User.find({username: regex}, function (err, username) {
        if (err) throw err;
        res.json(username);
    });
}

// Get a user from its email
function getEmail(req, res) {
    const Models = require('../models');

    let regex = new RegExp(["^", req.params.email, "$"].join(""), "i");

    Models.User.find({email: regex}, function (err, email) {
        if (err) throw err;
        res.json(email);
    });
}

// Get a conversation via its id and populate the users in it
function getConversation(id) {

    return new Promise(function (resolve) {

        const Model = require("../models");
        Model.Conversation.findOne({_id:id}).exec(function (err, data) {
            if (err) throw err;
            resolve(data);
        })

    });
}

function userBelongsToTheConversation(conversationId, userId) {
    return new Promise(function (resolve, reject) {

        let o_conversationId;

        // As ObjectId must follows specific characteristics we must do try catch clause in case the cast is not permitted
        try {
             o_conversationId = mongoose.Types.ObjectId(conversationId);
        } catch (e) {
            resolve(false);
            return;
        }

        const Models = require("../models");
        Models.Conversation.find({_id: conversationId, "users" : { $in : [userId]  } } ).exec(function (err, conversations) {
            if (err) throw err;

            // If the size is greater than 0 that means the user belongs to the conversation
            if (conversations.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    })
}

// Simple method to get the "strength"
function getPasswordStrength(password) {
    let toReturn;

    // If the password length is less than or equal to 6
    if(password.length<=6) {
        toReturn = 0;
    }

    // If the password length is greater than 6 and contain any lowercase alphabet or any number or any special character
    if(password.length>6 && (password.match(/[a-z]/) || password.match(/\d+/) || password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/))) {
        toReturn = 1;
    }

    // If the password length is greater than 6 and contain alphabet,number,special character respectively
    if(password.length>6 && ((password.match(/[a-z]/) && password.match(/\d+/)) || (password.match(/\d+/) && password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) || (password.match(/[a-z]/) && password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)))) {
        toReturn = 2;
    }

    // If the password length is greater than 6 and must contain alphabets,numbers and special characters
    if(password.length>6 && password.match(/[a-z]/) && password.match(/\d+/) && password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) {
        toReturn = 3;
    }

    return toReturn;
}

// Get the conversations of a user from its id
function getUserConversations(id) {
    return new Promise(function (resolve, reject) {

        const Models = require("../models");
        Models.Conversation.find({"users" : { $in : [id]  } } ).exec(function (err, conversations) {
            //Models.User.find({"users": id}, function (err, conversations) {
            if (err) throw err;

            resolve(conversations);
        });
    })
}

// TODO SEND AN EMAIL EACH TIME SOMEONE CREATES A CONVERSATION WITH A DUDE IN IT

// Send a socket to say a new conversation has been created and the user is part of it

// Create a conversation with a list of participants, the leader with its id and the names of the friends.
function createConversation(leaderId, friends, name) {

    return new Promise(function (resolve) {

        const Models = require("../models");

        let formatedFriends = [];
        let friendIds = [];

        // Format the friends names with a regex to be case unsensitive
        friends.forEach(function (f) {
            formatedFriends.push(new RegExp(["^", f, "$"].join(""), "i"));
        });

        // We first find the ids of the friends (if they exists)
        Models.User.find({'username': { $in: formatedFriends}}, function(err, docs){
            return docs;
        }).then(function (response) {

            // We loop here and push the ids in the array
            response.forEach(function (d) {
                friendIds.push(d._id);
            });

            return friendIds;

        }).then(function (idList) {

            let users = idList;

            // Push the leader id in it
            users.push(leaderId);

            // Create a new conversation
            const newConversation = Models.Conversation({
                name: name,
                users: users
            });

            // Save it
            newConversation.save(function (err, result) {
                if (err) throw err;

                // Then resolve the result to redirect the user
                resolve(result);
            });
        });

    });
}

// Add a message into the database
function addMessageToDatabase(message) {

    const Models = require("../models");

    const newMessage = Models.Message(message);

    newMessage.save(function (err) {
        if (err) throw err;
    });
}

// Update the last seen attribute of a user
function setLastSeenUser(userId) {
    const Models = require("../models");
    Models.User.findOneAndUpdate({_id: userId}, {lastseen:Date.now()}, function (err) {
        if (err) throw err;
    })
}

// Delete a given conversation
function deleteConversation(conversationId) {
    const Models = require("../models");
    Models.Conversation.deleteOne({_id: conversationId}, function (err) {
        if (err) throw err;
    });
}

// Rename a given conversation
function renameConversation(conversationId, name) {
    const Models = require("../models");
    Models.Conversation.updateOne({_id: conversationId}, {name: name}, function(err, res) {
        if (err) throw err;
    });
}

// Add a user to a given conversation
function addUserToConversation(username, conversationId) {

    return new Promise(function (resolve, reject) {

        // First we check that the friend exists (we get his id)
        const Models = require('../models');

        let regex = new RegExp(["^", username, "$"].join(""), "i");

        Models.User.find({username: regex}, function (err, user) {
            if (err) throw err;

            // If we do not get one result this means this is not a valid user
            if (user.length != 1) {
                resolve('Error: User do not exists');
                return;
            }

            // Now we push the new user into the conversation (the key $addToSet prevents duplicates)
            Models.Conversation.findOneAndUpdate({_id: conversationId}, {$addToSet: {users: user[0]._id}}, function (err, result) {
                if (err) throw err;
                resolve('done');
            });

        });

    });

}

// Get all the messages of a conversation
function getMessagesFromConversation(conversationId) {
    return new Promise(function (resolve, reject) {
        const Models = require("../models");
        Models.Message.find({conversationId: conversationId} ).sort({$natural:1}).limit(100).populate('senderId').exec(function (err, messages) {
            if (err) throw err;
            resolve(messages);
        });
    })
}

module.exports.getConversation = getConversation;
module.exports.renameConversation = renameConversation;
module.exports.deleteConversation = deleteConversation;
module.exports.addUserToConversation = addUserToConversation;
module.exports.getUserConversations = getUserConversations;
module.exports.createConversation = createConversation;
module.exports.addMessageToDatabase = addMessageToDatabase;
module.exports.setLastSeenUser = setLastSeenUser;
module.exports.getMessagesFromConversation = getMessagesFromConversation;

module.exports.goToHome = goToHome;
module.exports.goToConversation = goToConversation;
module.exports.goToProfile = goToProfile;
module.exports.goToSignUp = goToSignUp;
module.exports.signUpPerson = signUpPerson;
module.exports.goToLogIn = goToLogIn;
module.exports.logInPerson = logInPerson;
module.exports.logOut = logOut;
module.exports.getUsername = getUsername;
module.exports.getEmail = getEmail;