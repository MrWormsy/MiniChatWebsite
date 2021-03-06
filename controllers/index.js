const mongoose = require('mongoose');

// Go to Home
function goToHome(req, res) {
    res.render('index', {page : 'home', session: req.session, conversations: null});


    //createConversation('5e8dd22bc7f6866dad8e33b7', [new RegExp(["^", "PRout", "$"].join(""), "i"), new RegExp(["^", "Tamer", "$"].join(""), "i"), new RegExp(["^", 'Coucou', "$"].join(""), "i")], "MERDE");

}

// Go to the leaderboard page
function goToLeaderboard(req, res) {
    res.render('index', {page : 'leaderboard', session: req.session});
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

        Models.User.findOne({username: regex}, function (err, user) {
            if (err) throw err;

            // We want to send as well some information about the user
            getUserInfos(req.session.userid).then(function (infos) {
                res.render('index', {page : 'profile', session: req.session, user: user, infos: infos});
            })
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

            // As we have all the conversations we want know to know he many messages he missed
            // We first get the last seen time
            getLastSeenUser(id).then(function (lastSeen) {

                // We get how many messages were received after this time and then we resolve
                let promises = [];
                conversations.forEach(function (conv) {
                    promises.push(getNumberOfMessagesFrom(conv, lastSeen));
                });

                // When all the promises are done we can resolve
                Promise.all(promises).then(function (result) {
                    resolve(result);
                })
            });
        });
    })
}

// Get how many messages were received after a given time
function getNumberOfMessagesFrom(conversation, when) {
    return new Promise(function (resolve) {
        const Models = require("../models");
        Models.Message.countDocuments({conversationId: conversation._id, timestamp: {$gte: when}}).exec(function (err, numberOfMessages) {
            if (err) throw err;

            // Resolve the number of messages
            resolve({_id: conversation._id, numberOfMessages: numberOfMessages, name: conversation.name});
        })
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

// Get the usernames of the users of the conversation
function getUsernamesOfConversation(conversationId) {

    return new Promise(function (resolve) {

        // We get the conversation with the populated users and we only want to keep their usernames.
        const Models = require("../models");
        Models.Conversation.findOne({_id: conversationId}).populate('users').exec(function (err, conversation) {
            if (err) throw err;

            // If we dont get a converation we resolve an empty list
            if (!conversation) {
                resolve([]);
                return;
            }

            // We only want to keep the usernames
            resolve(conversation.users.map((item) => { return item["username"]; }));
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

// Get the last time the user was seen
function getLastSeenUser(userId) {
    return new Promise(function (resolve) {

        const Models = require('../models');
        Models.User.findOne({_id: userId}, function (err, user) {
            if (err) throw err;

            // If the user do not exists we resolve -1
            if (!user) {
                resolve(-1);
                return;
            }

            // Else we return the last time
            resolve(user.lastseen);
        });

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

// Get all the messages a user has sent
function getNumberOfMessagesSentByUser(userId) {

    return new Promise(function (resolve) {

        const Models = require("../models");
        Models.Message.countDocuments({senderId: userId}).exec(function (err, count) {
            if (err) throw err;

            resolve(count);
        });
    });
}

// Get useful information about a user
function getUserInfos(userid) {
    return new Promise(function (resolveFunction) {

        // We want to get some information like the number of conversations, of messages ect...
        let nbConversations;
        let countMessages;

        // First the number of conversations
        let nbConversationsPromise = new Promise(function (resolve) {
            getUserConversations(userid).then(function (conversations) {
                nbConversations = conversations.length;
                resolve();
            });
        });

        // Then the number of messages sent
        let nbOfMessagesSentPromise = new Promise(function (resolve) {
            getNumberOfMessagesSentByUser(userid).then(function (count) {
                countMessages = count;
                resolve();
            });
        });

        // When everything is finished we can resolve
        Promise.all([nbConversationsPromise, nbOfMessagesSentPromise]).then(function () {
            resolveFunction({nbConversations: nbConversations, countMessages: countMessages});
        });
    });
}

// Get the overall stats of the website
function getOverallStats() {

    let promise;

    return new Promise(function (resolveFunction) {

       // First we want to get all the users and then get the stats of all those users
        const Models = require("../models");
        Models.User.find({}).exec(function (err, users) {
            if (err) throw err;

            let promises = [];

            users.forEach(function (user) {
                promise = new Promise(function (resolve) {
                      getUserInfos(user._id).then(function (infos) {
                          resolve({username: user.username, lastseen: user.lastseen, countMessages: infos.countMessages, nbConversations: infos.nbConversations});
                      });
                });

                promises.push(promise);
            });

            Promise.all(promises).then(function (userWithInfos) {
                resolveFunction(userWithInfos);
            })
        })
    });
}

module.exports.getConversation = getConversation;
module.exports.getOverallStats = getOverallStats;
module.exports.getUsernamesOfConversation = getUsernamesOfConversation;
module.exports.renameConversation = renameConversation;
module.exports.deleteConversation = deleteConversation;
module.exports.addUserToConversation = addUserToConversation;
module.exports.getUserConversations = getUserConversations;
module.exports.createConversation = createConversation;
module.exports.addMessageToDatabase = addMessageToDatabase;
module.exports.setLastSeenUser = setLastSeenUser;
module.exports.getLastSeenUser = getLastSeenUser;
module.exports.getMessagesFromConversation = getMessagesFromConversation;

module.exports.goToHome = goToHome;
module.exports.goToLeaderboard = goToLeaderboard;
module.exports.goToConversation = goToConversation;
module.exports.goToProfile = goToProfile;
module.exports.goToSignUp = goToSignUp;
module.exports.signUpPerson = signUpPerson;
module.exports.goToLogIn = goToLogIn;
module.exports.logInPerson = logInPerson;
module.exports.logOut = logOut;
module.exports.getUsername = getUsername;
module.exports.getEmail = getEmail;