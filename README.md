# MiniChatWebsite (With David Petit in Pair Programming)
## README under construction
- We can create an account and log into this account.
- We can send messages to everyone belonging to the conversation.
- We are able to retrieve all the user's conversations with a timestamp.
- You can't access to the conversations you do not belong to.
- You can create, invite, rename and delete a conversation.
- The messages are stored in the database and retrieved when opening a conversation.
- To deliver the messages we are using a socket.io namespace (/conversations) and a room for every active conversations.
- We are able to retrieve all the user currently connected to the website (they are listed in the navbar).
- We are now using replica sets to be fault tolerant with 3 replica sets and 1 arbiter.
- We are able to know how many people are on a conversation (and who is currently online).
- We know how many messages we missed while being offline.
- We can see how many messages a user sent and how many conversations he belongs to.
- There is a leaderboard page where we can see the stats of all the users.