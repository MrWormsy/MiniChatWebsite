const mongoose = require('mongoose');
const Schema = mongoose.Schema; //majuscule car instance d'un objet (tester si ça marche avec une minuscule)

const User = new Schema({
    username : String,
    password: String,
    email : String
});

const Conversation = new Schema({
    name: String,
    users: [{type: Schema.Types.ObjectId, ref: 'User'}]
});

const Message = new Schema({
    timestamp : Number,
    conversationId: String,
    senderId : String,
    content: String
});

module.exports = {
    User: mongoose.model('User', User),
    Message: mongoose.model('Message', Message),
    Conversation: mongoose.model('Conversation', Conversation)
};